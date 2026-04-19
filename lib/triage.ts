import type Anthropic from "@anthropic-ai/sdk";
import mongoose from "mongoose";
import { createCalendarEvent } from "@/lib/calendar-events";
import { fetchEmailBody } from "@/lib/email";
import { createCard } from "@/lib/kanban";
import { anthropic, calculateCost, logLlmUsage } from "@/lib/llm";
import { connectDB } from "@/lib/mongodb";
import { EmailModel } from "@/models/Email";
import {
  EmailTriageModel,
  type TriageCategory,
  type TriagePriority,
} from "@/models/EmailTriage";
import {
  getOrCreateTriageSettings,
  type ICategoryRouting,
  type ITriageSettings,
} from "@/models/TriageSettings";

const CATEGORIES: TriageCategory[] = [
  "spam",
  "newsletter",
  "promo",
  "purchases",
  "fyi",
  "action-needed",
  "scheduled",
];

const PRIORITIES: TriagePriority[] = [
  "none",
  "low",
  "medium",
  "high",
  "urgent",
];

interface PrefilterResult {
  id: string;
  isSpam: boolean;
  confidence: number;
}

interface TriageRunStats {
  scanned: number;
  prefilteredSpam: number;
  fullTriaged: number;
  autoAcceptedTasks: number;
  autoAcceptedEvents: number;
  errors: number;
}

interface TriageEmailContext {
  subject: string;
  from: { name: string | undefined; address: string }[];
  date: Date;
}

interface PrefilterEmailCandidate {
  _id: string;
  subject: string;
  from: TriageEmailContext["from"];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTriagePriority(value: unknown): value is TriagePriority {
  return (
    typeof value === "string" &&
    PRIORITIES.some((priority) => priority === value)
  );
}

function isTriageCategory(value: unknown): value is TriageCategory {
  return (
    typeof value === "string" &&
    CATEGORIES.some((category) => category === value)
  );
}

function getStringOverride(
  overrides: Record<string, unknown> | undefined,
  key: string,
): string | undefined {
  const value = overrides?.[key];
  return typeof value === "string" ? value : undefined;
}

function getDateOverride(
  overrides: Record<string, unknown> | undefined,
  key: string,
): Date | undefined {
  const value = getStringOverride(overrides, key);
  return value ? parseDate(value) : undefined;
}

function formatFrom(from: TriageEmailContext["from"]): string {
  return from
    .map((f) => (f.name ? `${f.name} <${f.address}>` : f.address))
    .join(", ");
}

async function runPrefilter(
  model: string,
  emails: PrefilterEmailCandidate[],
): Promise<PrefilterResult[]> {
  if (emails.length === 0) return [];

  const system =
    "You are an email spam classifier. Given a JSON array of emails (id, subject, from), return a JSON array of {id, isSpam, confidence} where isSpam is true for obvious marketing, phishing, bulk promotional, or junk. Be conservative — when in doubt, mark as NOT spam so it can be reviewed fully. confidence is 0..1. Output ONLY the JSON array, no prose.";

  const userContent = JSON.stringify(
    emails.map((e) => ({
      id: e._id,
      subject: e.subject,
      from: formatFrom(e.from),
    })),
  );

  const response = await anthropic.messages.create({
    model: model as Anthropic.Model,
    max_tokens: 4096,
    system,
    messages: [{ role: "user", content: userContent }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  let parsed: PrefilterResult[] = [];
  try {
    const jsonStart = text.indexOf("[");
    const jsonEnd = text.lastIndexOf("]");
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    }
  } catch (err) {
    console.error("Prefilter parse failed:", err);
  }

  const cost = calculateCost(
    model,
    response.usage.input_tokens,
    response.usage.output_tokens,
  );
  logLlmUsage({
    llmModel: model,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    costUsd: cost,
    systemPrompt: system,
    userPrompt: userContent.slice(0, 2000),
    source: "email-triage-prefilter",
  });

  return parsed;
}

interface FullTriageResult {
  category: TriageCategory;
  confidence: number;
  summary: string;
  tasks: {
    title: string;
    description?: string;
    priority: TriagePriority;
    dueDate?: Date;
  }[];
  events: {
    title: string;
    date: Date;
    place?: string;
  }[];
}

function buildTriageTools(): Anthropic.Tool[] {
  return [
    {
      name: "classify_email",
      description:
        "Called ONCE per email to finalize classification. Must be the last tool called. Provides the category, confidence, and a short summary.",
      input_schema: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: CATEGORIES,
            description:
              "spam = junk/phishing/bulk-marketing; newsletter = legit subscription digest; promo = transactional marketing from known sender; purchases = receipts, invoices, order confirmations, or payment notices; fyi = informational, no action needed; action-needed = requires a reply/follow-up/task; scheduled = contains a specific meeting/appointment/event time.",
          },
          confidence: {
            type: "number",
            description: "0..1 confidence for the classification.",
          },
          summary: {
            type: "string",
            description: "1-2 sentence summary of the email content.",
          },
        },
        required: ["category", "confidence", "summary"],
      },
    },
    {
      name: "suggest_task",
      description:
        "Call 0 or more times to propose a follow-up task extracted from the email.",
      input_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          priority: { type: "string", enum: PRIORITIES },
          dueDate: {
            type: "string",
            description: "ISO 8601 due date if mentioned, else omit.",
          },
        },
        required: ["title", "priority"],
      },
    },
    {
      name: "suggest_event",
      description:
        "Call 0 or more times to propose a calendar event extracted from the email (meetings, appointments, deadlines with a specific date/time).",
      input_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          date: {
            type: "string",
            description: "ISO 8601 event start date/time.",
          },
          place: { type: "string" },
        },
        required: ["title", "date"],
      },
    },
  ];
}

function parseDate(val: unknown): Date | undefined {
  if (typeof val !== "string") return undefined;
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function coercePriority(val: unknown): TriagePriority {
  if (isTriagePriority(val)) {
    return val;
  }
  return "medium";
}

function coerceCategory(val: unknown): TriageCategory {
  if (isTriageCategory(val)) {
    return val;
  }
  return "fyi";
}

async function runFullTriage(
  model: string,
  email: TriageEmailContext,
  body: { text: string; html: string },
): Promise<FullTriageResult | null> {
  const system =
    "You are an email triage assistant. For the given email, call suggest_task (0..N) and suggest_event (0..N) to extract any actionable tasks or calendar events, then call classify_email EXACTLY ONCE to finalize. Always end with classify_email. Keep summary to 1-2 sentences. Use purchases for receipts, invoices, payment notices, or order confirmations that do not need follow-up. Only suggest tasks when the email genuinely needs a follow-up action. Only suggest events when a specific date/time is mentioned.";

  const bodyText =
    body.text || body.html.replace(/<[^>]+>/g, " ").slice(0, 8000);
  const prompt = `Subject: ${email.subject}
From: ${formatFrom(email.from)}
Date: ${email.date.toISOString()}

Body:
${bodyText.slice(0, 8000)}`;

  const tools = buildTriageTools();
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: prompt },
  ];

  const tasks: FullTriageResult["tasks"] = [];
  const events: FullTriageResult["events"] = [];
  let result: FullTriageResult | null = null;

  let totalIn = 0;
  let totalOut = 0;

  for (let i = 0; i < 8; i++) {
    const response = await anthropic.messages.create({
      model: model as Anthropic.Model,
      max_tokens: 4096,
      system,
      tools,
      messages,
    });

    totalIn += response.usage.input_tokens;
    totalOut += response.usage.output_tokens;

    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason !== "tool_use") break;

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    let classified = false;

    for (const block of response.content) {
      if (block.type !== "tool_use") continue;
      const input = isRecord(block.input) ? block.input : {};

      if (block.name === "suggest_task") {
        tasks.push({
          title: String(input.title ?? "Untitled"),
          description:
            typeof input.description === "string"
              ? input.description
              : undefined,
          priority: coercePriority(input.priority),
          dueDate: parseDate(input.dueDate),
        });
      } else if (block.name === "suggest_event") {
        const date = parseDate(input.date);
        if (date) {
          events.push({
            title: String(input.title ?? "Untitled"),
            date,
            place: typeof input.place === "string" ? input.place : undefined,
          });
        }
      } else if (block.name === "classify_email") {
        result = {
          category: coerceCategory(input.category),
          confidence:
            typeof input.confidence === "number" ? input.confidence : 0.5,
          summary: typeof input.summary === "string" ? input.summary : "",
          tasks,
          events,
        };
        classified = true;
      }

      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: "ok",
      });
    }

    messages.push({ role: "user", content: toolResults });
    if (classified) break;
  }

  const cost = calculateCost(model, totalIn, totalOut);
  logLlmUsage({
    llmModel: model,
    inputTokens: totalIn,
    outputTokens: totalOut,
    costUsd: cost,
    systemPrompt: system,
    userPrompt: prompt.slice(0, 4000),
    source: "email-triage-full",
  });

  return result;
}

async function autoAccept(
  triageId: mongoose.Types.ObjectId,
  result: FullTriageResult,
  routing: ICategoryRouting,
): Promise<{ tasks: number; events: number }> {
  const confOk = result.confidence >= routing.autoAcceptThreshold;
  let taskCount = 0;

  if (
    routing.autoCreateCard &&
    confOk &&
    routing.kanbanBoardId &&
    routing.kanbanColumnId
  ) {
    for (let i = 0; i < result.tasks.length; i++) {
      const t = result.tasks[i];
      try {
        const card = await createCard(
          routing.kanbanBoardId,
          routing.kanbanColumnId,
          {
            title: t.title,
            description: t.description,
            priority: t.priority,
            dueDate: t.dueDate ? t.dueDate.toISOString() : undefined,
          },
        );
        await EmailTriageModel.updateOne(
          { _id: triageId },
          {
            $set: {
              [`suggestedTasks.${i}.status`]: "accepted",
              [`suggestedTasks.${i}.acceptedCardId`]: card._id,
            },
          },
        );
        taskCount++;
      } catch (err) {
        console.error("auto-accept task failed:", err);
      }
    }
  }

  return { tasks: taskCount, events: 0 };
}

export async function runTriage(options?: {
  since?: Date;
}): Promise<TriageRunStats> {
  await connectDB();
  const settings = await getOrCreateTriageSettings();
  if (!settings.enabled) {
    return {
      scanned: 0,
      prefilteredSpam: 0,
      fullTriaged: 0,
      autoAcceptedTasks: 0,
      autoAcceptedEvents: 0,
      errors: 0,
    };
  }

  console.log("Starting triage run with settings:", options);

  const since =
    options?.since ??
    settings.lastRunAt ??
    new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);

  const alreadyTriaged = await EmailTriageModel.find({
    triagedAt: { $gte: since },
  })
    .select("emailId")
    .lean();
  const alreadyIds = new Set(alreadyTriaged.map((t) => t.emailId.toString()));

  const emails = await EmailModel.find({ date: { $gte: since } })
    .sort({ date: 1 })
    .lean();

  const candidates = emails.filter((e) => !alreadyIds.has(e._id.toString()));

  console.log(candidates.length, "emails found since", since.toISOString());

  const stats: TriageRunStats = {
    scanned: candidates.length,
    prefilteredSpam: 0,
    fullTriaged: 0,
    autoAcceptedTasks: 0,
    autoAcceptedEvents: 0,
    errors: 0,
  };

  if (candidates.length === 0) {
    await updateLastRunAt(settings);
    return stats;
  }

  const prefiltered = await runPrefilter(
    settings.prefilterModel,
    candidates.map((e) => ({
      _id: e._id.toString(),
      subject: e.subject,
      from: e.from,
    })),
  );
  const spamIds = new Set(prefiltered.filter((r) => r.isSpam).map((r) => r.id));
  const prefilterMap = new Map(prefiltered.map((r) => [r.id, r]));

  for (const email of candidates) {
    const id = email._id.toString();
    if (!spamIds.has(id)) continue;
    try {
      await EmailTriageModel.create({
        emailId: email._id,
        accountId: email.accountId,
        stage: "prefilter",
        category: "spam",
        confidence: prefilterMap.get(id)?.confidence ?? 0.9,
        modelUsed: settings.prefilterModel,
        triagedAt: new Date(),
      });
      stats.prefilteredSpam++;
    } catch (err) {
      console.error("prefilter insert failed:", err);
      stats.errors++;
    }
  }

  for (const email of candidates) {
    if (spamIds.has(email._id.toString())) continue;
    try {
      const body = await fetchEmailBody(String(email.accountId), email.uid);
      if (!body) {
        stats.errors++;
        continue;
      }
      const result = await runFullTriage(
        settings.fullModel,
        {
          subject: email.subject,
          from: email.from,
          date: email.date,
        },
        { text: body.text, html: body.html },
      );
      if (!result) {
        stats.errors++;
        continue;
      }

      const doc = await EmailTriageModel.create({
        emailId: email._id,
        accountId: email.accountId,
        stage: "full",
        category: result.category,
        confidence: result.confidence,
        summary: result.summary,
        suggestedTasks: result.tasks.map((t) => ({
          title: t.title,
          description: t.description,
          priority: t.priority,
          dueDate: t.dueDate,
          status: "pending",
        })),
        suggestedEvents: result.events.map((e) => ({
          title: e.title,
          date: e.date,
          place: e.place,
          status: "pending",
        })),
        modelUsed: settings.fullModel,
        triagedAt: new Date(),
      });
      stats.fullTriaged++;

      const routing = settings.categoryRouting?.[result.category];
      if (routing) {
        const accepted = await autoAccept(doc._id, result, routing);
        stats.autoAcceptedTasks += accepted.tasks;
        stats.autoAcceptedEvents += accepted.events;
      }
    } catch (err) {
      console.error("full triage failed for", email._id, err);
      stats.errors++;
    }
  }

  await updateLastRunAt(settings);
  return stats;
}

async function updateLastRunAt(
  settings: mongoose.HydratedDocument<ITriageSettings>,
): Promise<void> {
  settings.lastRunAt = new Date();
  await settings.save();
}

export async function acceptSuggestion(
  triageId: string,
  suggestionId: string,
  type: "task" | "event",
  overrides?: Record<string, unknown>,
): Promise<{ ok: true; acceptedId: string } | { ok: false; error: string }> {
  await connectDB();
  const triage = await EmailTriageModel.findById(triageId);
  if (!triage) return { ok: false, error: "Triage not found" };

  if (type === "task") {
    const idx = triage.suggestedTasks.findIndex(
      (t) => t._id.toString() === suggestionId,
    );
    if (idx < 0) return { ok: false, error: "Suggestion not found" };
    const t = triage.suggestedTasks[idx];
    const boardId =
      getStringOverride(overrides, "boardId") ??
      (await resolveRoutingBoard(triage.category));
    const columnId =
      getStringOverride(overrides, "columnId") ??
      (await resolveRoutingColumn(triage.category));
    if (!boardId || !columnId) {
      return { ok: false, error: "No kanban routing configured" };
    }
    const card = await createCard(boardId, columnId, {
      title: getStringOverride(overrides, "title") ?? t.title,
      description: getStringOverride(overrides, "description") ?? t.description,
      priority: getStringOverride(overrides, "priority") ?? t.priority,
      dueDate:
        getStringOverride(overrides, "dueDate") ??
        (t.dueDate ? t.dueDate.toISOString() : undefined),
    });
    triage.suggestedTasks[idx].status = "accepted";
    triage.suggestedTasks[idx].acceptedCardId = new mongoose.Types.ObjectId(
      card._id,
    );
    await triage.save();
    return { ok: true, acceptedId: card._id.toString() };
  }

  const idx = triage.suggestedEvents.findIndex(
    (e) => e._id.toString() === suggestionId,
  );
  if (idx < 0) return { ok: false, error: "Suggestion not found" };
  const ev = triage.suggestedEvents[idx];
  const created = await createCalendarEvent({
    title: getStringOverride(overrides, "title") ?? ev.title,
    date: getDateOverride(overrides, "date") ?? ev.date,
    place: getStringOverride(overrides, "place") ?? ev.place,
    status: "scheduled",
  });
  if (!created) return { ok: false, error: "Failed to create event" };
  triage.suggestedEvents[idx].status = "accepted";
  triage.suggestedEvents[idx].acceptedEventId = new mongoose.Types.ObjectId(
    created._id,
  );
  await triage.save();
  return { ok: true, acceptedId: created._id.toString() };
}

export async function dismissSuggestion(
  triageId: string,
  suggestionId: string,
  type: "task" | "event",
): Promise<{ ok: boolean }> {
  await connectDB();
  const key = type === "task" ? "suggestedTasks" : "suggestedEvents";
  const res = await EmailTriageModel.updateOne(
    {
      _id: triageId,
      [`${key}._id`]: new mongoose.Types.ObjectId(suggestionId),
    },
    { $set: { [`${key}.$.status`]: "dismissed" } },
  );
  return { ok: res.modifiedCount > 0 };
}

async function resolveRoutingBoard(
  category: TriageCategory,
): Promise<string | undefined> {
  const settings = await getOrCreateTriageSettings();
  return settings.categoryRouting?.[category]?.kanbanBoardId;
}

async function resolveRoutingColumn(
  category: TriageCategory,
): Promise<string | undefined> {
  const settings = await getOrCreateTriageSettings();
  return settings.categoryRouting?.[category]?.kanbanColumnId;
}
