import { anthropic, calculateCost, logLlmUsage } from "@/lib/llm";
import { Bookmark, type ILeanBookmark } from "@/models/Bookmark";
import { BookmarkGroup, type ILeanBookmarkGroup } from "@/models/BookmarkGroup";
import { connectDB } from "@/lib/mongodb";

const MODEL = "claude-haiku-4-5-20251001";
const PASS_ALL_THRESHOLD = 20;
const SOURCE = "bookmark-categorize";

export interface CategorizeInput {
  url: string;
  title: string;
  description?: string;
  siteName?: string;
}

export interface NewGroupSpec {
  name: string;
  description?: string;
  parentName?: string | null;
}

export interface GroupUpdateSpec {
  groupId: string;
  parentName?: string | null;
  rename?: string;
}

export interface CategorizeResult {
  tags: string[];
  joinGroupIds: string[];
  newGroups: NewGroupSpec[];
  groupUpdates: GroupUpdateSpec[];
  relatedBookmarkIds: string[];
}

const SYSTEM_PROMPT_PASS_ALL = `You are an assistant that categorizes a user's bookmarked web resources into tags and conceptual groups, building a hierarchical knowledge graph similar to Obsidian.

Output ONLY a single JSON object matching this schema, with no prose, no markdown fences:
{
  "tags": string[],                                                                // 1-5 short lowercase tags (kebab-case if multi-word)
  "joinGroupIds": string[],                                                        // existing group _ids the bookmark belongs to (subset of provided)
  "newGroups": [{ "name": string, "description"?: string, "parentName"?: string }], // new groups to create. parentName nests under an existing or to-be-created group
  "groupUpdates": [{ "groupId": string, "parentName"?: string | null, "rename"?: string }], // restructure existing groups (nest under new parent, or rename)
  "relatedBookmarkIds": string[]                                                   // _ids of provided bookmarks strongly related to the new one
}

Grouping rules (critical — read carefully):
- Prefer BROAD groups over narrow specialization. With few items, a single broad umbrella is better than multiple narrow ones.
- Only specialize (create sub-groups) once a parent would have 5+ members. Before that, one group per topic family.
- If existing groups are narrower siblings of a broader concept that the new bookmark also fits (e.g., "CS Papers", "IT Papers" + new "AI Paper"), create the broader parent ("Papers") in newGroups, then emit groupUpdates that set parentName of the narrow existing groups to the new parent. The new bookmark should join the broader parent directly (joinGroupIds / newGroups).
- Avoid creating sibling sub-groups preemptively. If only one specialization exists so far, keep the new bookmark in the broader family rather than inventing a second specialization.
- parentName refers to a group's \`name\` (either an existing group or another entry in this response's newGroups).

Naming & tags:
- Group names: short, Title Case, conceptual (e.g., "Papers", "Frontend Performance", "Vector Databases").
- Tags: granular, lowercase. Topics, not generic categories.
- relatedBookmarkIds: only when there is a strong topical overlap. Empty array is fine.`;

const SYSTEM_PROMPT_GROUPS_ONLY = `You are an assistant that assigns a new bookmark to existing conceptual groups in the user's knowledge graph.

Output ONLY a single JSON object matching this schema, with no prose, no markdown fences:
{
  "tags": string[],                                                                // 1-5 short lowercase tags
  "joinGroupIds": string[],                                                        // existing group _ids the bookmark belongs to
  "newGroups": [{ "name": string, "description"?: string, "parentName"?: string }], // at most ONE new group if no existing fits
  "groupUpdates": [],                                                              // always empty in this mode
  "relatedBookmarkIds": []                                                         // always empty in this mode
}

Rules:
- Strongly prefer joining existing groups. Only create a new group if clearly distinct.
- parentName may reference an existing group's name to nest the new group.
- Group names: short, Title Case, conceptual.`;

interface CompactBookmark {
  _id: string;
  title: string;
  url: string;
  tags: string[];
  groupIds: string[];
}

interface CompactGroup {
  _id: string;
  name: string;
  description?: string;
  parentName?: string | null;
  memberCount: number;
}

function buildPromptPassAll(
  newBookmark: CategorizeInput,
  bookmarks: CompactBookmark[],
  groups: CompactGroup[],
): string {
  return `<existing_groups>
${JSON.stringify(groups, null, 2)}
</existing_groups>

<existing_bookmarks>
${JSON.stringify(bookmarks, null, 2)}
</existing_bookmarks>

<new_bookmark>
${JSON.stringify(newBookmark, null, 2)}
</new_bookmark>

Categorize the new bookmark. Restructure existing groups into a hierarchy when it helps. Return JSON only.`;
}

function buildPromptGroupsOnly(
  newBookmark: CategorizeInput,
  groups: CompactGroup[],
): string {
  return `<existing_groups>
${JSON.stringify(groups, null, 2)}
</existing_groups>

<new_bookmark>
${JSON.stringify(newBookmark, null, 2)}
</new_bookmark>

Decide which existing groups (if any) the new bookmark joins, or propose at most ONE new group. Return JSON only.`;
}

function buildPromptRelations(
  newBookmark: CategorizeInput,
  groupBookmarks: CompactBookmark[],
): string {
  return `<group_bookmarks>
${JSON.stringify(groupBookmarks, null, 2)}
</group_bookmarks>

<new_bookmark>
${JSON.stringify(newBookmark, null, 2)}
</new_bookmark>

Identify which of the group's existing bookmarks are most strongly related to the new bookmark. Return JSON: { "relatedBookmarkIds": string[] }.`;
}

function parseJson<T>(text: string): T | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as T;
  } catch {
    return null;
  }
}

async function callLlm(prompt: string, system: string): Promise<string> {
  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system,
    messages: [{ role: "user", content: prompt }],
  });
  const inputTokens = res.usage.input_tokens;
  const outputTokens = res.usage.output_tokens;
  const costUsd = calculateCost(MODEL, inputTokens, outputTokens);
  logLlmUsage({
    llmModel: MODEL,
    inputTokens,
    outputTokens,
    costUsd,
    systemPrompt: system,
    userPrompt: prompt,
    source: SOURCE,
  });
  const text = res.content
    .filter((b): b is Extract<typeof b, { type: "text" }> => b.type === "text")
    .map((b) => b.text)
    .join("");
  return text;
}

export async function categorizeBookmark(
  input: CategorizeInput,
): Promise<CategorizeResult> {
  await connectDB();

  const [bookmarksRaw, groupsRaw, totalCount, memberCounts] = await Promise.all([
    Bookmark.find()
      .select("_id title url tags groupIds")
      .sort({ createdAt: -1 })
      .limit(PASS_ALL_THRESHOLD)
      .lean<ILeanBookmark[]>()
      .exec(),
    BookmarkGroup.find()
      .select("_id name description parentId")
      .lean<ILeanBookmarkGroup[]>()
      .exec(),
    Bookmark.countDocuments(),
    Bookmark.aggregate<{ _id: string; count: number }>([
      { $unwind: "$groupIds" },
      { $group: { _id: { $toString: "$groupIds" }, count: { $sum: 1 } } },
    ]),
  ]);

  const nameById = new Map(
    groupsRaw.map((g) => [String(g._id), g.name] as const),
  );
  const countById = new Map(memberCounts.map((m) => [m._id, m.count] as const));

  const groups: CompactGroup[] = groupsRaw.map((g) => ({
    _id: String(g._id),
    name: g.name,
    description: g.description,
    parentName: g.parentId ? nameById.get(String(g.parentId)) ?? null : null,
    memberCount: countById.get(String(g._id)) ?? 0,
  }));

  const empty: CategorizeResult = {
    tags: [],
    joinGroupIds: [],
    newGroups: [],
    groupUpdates: [],
    relatedBookmarkIds: [],
  };

  if (totalCount < PASS_ALL_THRESHOLD) {
    const bookmarks: CompactBookmark[] = bookmarksRaw.map((b) => ({
      _id: String(b._id),
      title: b.title,
      url: b.url,
      tags: b.tags || [],
      groupIds: (b.groupIds || []).map(String),
    }));
    const prompt = buildPromptPassAll(input, bookmarks, groups);
    const text = await callLlm(prompt, SYSTEM_PROMPT_PASS_ALL);
    const parsed = parseJson<CategorizeResult>(text);
    if (!parsed) return empty;
    return {
      tags: parsed.tags || [],
      joinGroupIds: parsed.joinGroupIds || [],
      newGroups: parsed.newGroups || [],
      groupUpdates: parsed.groupUpdates || [],
      relatedBookmarkIds: parsed.relatedBookmarkIds || [],
    };
  }

  const phaseAPrompt = buildPromptGroupsOnly(input, groups);
  const phaseAText = await callLlm(phaseAPrompt, SYSTEM_PROMPT_GROUPS_ONLY);
  const phaseA = parseJson<CategorizeResult>(phaseAText) || empty;

  let relatedBookmarkIds: string[] = [];
  if (phaseA.joinGroupIds.length > 0) {
    const groupBookmarksRaw = await Bookmark.find({
      groupIds: { $in: phaseA.joinGroupIds },
    })
      .select("_id title url tags groupIds")
      .limit(40)
      .lean<ILeanBookmark[]>()
      .exec();
    const groupBookmarks: CompactBookmark[] = groupBookmarksRaw.map((b) => ({
      _id: String(b._id),
      title: b.title,
      url: b.url,
      tags: b.tags || [],
      groupIds: (b.groupIds || []).map(String),
    }));
    if (groupBookmarks.length > 0) {
      const phaseBPrompt = buildPromptRelations(input, groupBookmarks);
      const phaseBText = await callLlm(phaseBPrompt, SYSTEM_PROMPT_GROUPS_ONLY);
      const phaseB = parseJson<{ relatedBookmarkIds: string[] }>(phaseBText);
      relatedBookmarkIds = phaseB?.relatedBookmarkIds || [];
    }
  }

  return {
    tags: phaseA.tags || [],
    joinGroupIds: phaseA.joinGroupIds || [],
    newGroups: phaseA.newGroups || [],
    groupUpdates: [],
    relatedBookmarkIds,
  };
}
