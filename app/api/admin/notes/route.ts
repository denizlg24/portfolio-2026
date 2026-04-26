import mongoose from "mongoose";
import { type NextRequest, NextResponse } from "next/server";
import {
  resolveIncomingCategorization,
  upsertRelatedEdges,
} from "@/lib/apply-note-categorization";
import { fetchUrlMetadata, type UrlMetadata } from "@/lib/fetch-url-metadata";
import { connectDB } from "@/lib/mongodb";
import {
  pruneGroupIds,
  serializeEdge,
  serializeGroup,
  serializeNote,
} from "@/lib/note-route-utils";
import { requireAdmin } from "@/lib/require-admin";
import { type ILeanNote, Note } from "@/models/Note";
import { type ILeanNoteEdge, NoteEdge } from "@/models/NoteEdge";
import { type ILeanNoteGroup, NoteGroup } from "@/models/NoteGroup";

function pickString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    await connectDB();

    const [notes, groups, edges] = await Promise.all([
      Note.find().sort({ createdAt: -1 }).lean<ILeanNote[]>().exec(),
      NoteGroup.find().sort({ name: 1 }).lean<ILeanNoteGroup[]>().exec(),
      NoteEdge.find().lean<ILeanNoteEdge[]>().exec(),
    ]);

    return NextResponse.json(
      {
        notes: notes.map(serializeNote),
        groups: groups.map(serializeGroup),
        edges: edges.map(serializeEdge),
        stats: {
          total: notes.length,
          groups: groups.length,
          edges: edges.length,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const url = pickString(body.url);
    const skipCategorize = body.skipCategorize === true;
    const skipMetadataFetch = body.skipMetadataFetch === true;

    await connectDB();

    if (url) {
      const existing = await Note.findOne({ url }).lean<ILeanNote>().exec();
      if (existing) {
        return NextResponse.json(
          {
            error: "Note already exists",
            note: serializeNote(existing),
          },
          { status: 409 },
        );
      }
    }

    const providedMeta =
      body.metadata && typeof body.metadata === "object"
        ? (body.metadata as Record<string, unknown>)
        : null;

    let metadata: UrlMetadata | null = null;
    if (url) {
      if (providedMeta) {
        metadata = {
          url: pickString(providedMeta.url) ?? url,
          title: pickString(providedMeta.title) ?? url,
          description: pickString(providedMeta.description),
          favicon: pickString(providedMeta.favicon),
          image: pickString(providedMeta.image),
          siteName: pickString(providedMeta.siteName),
        };
      } else if (!skipMetadataFetch) {
        metadata = await fetchUrlMetadata(url);
      } else {
        metadata = { url, title: url };
      }
    }

    const manualTitle = pickString(body.title);
    const title = manualTitle ?? metadata?.title;
    if (!title) {
      return NextResponse.json(
        { error: "title required when url is blank" },
        { status: 400 },
      );
    }

    const manualDescription =
      typeof body.description === "string" ? body.description : undefined;
    const manualClass = pickString(body.class);
    const manualContent = typeof body.content === "string" ? body.content : "";
    const manualStatus =
      body.status === "archived" || body.status === "open"
        ? body.status
        : undefined;
    const rawManualTags: unknown[] = Array.isArray(body.tags) ? body.tags : [];
    const manualTags = rawManualTags.filter(
      (tag): tag is string => typeof tag === "string",
    );
    const rawManualGroupIds: unknown[] = Array.isArray(body.groupIds)
      ? body.groupIds
      : [];
    const manualGroupIds = rawManualGroupIds.filter(
      (groupId: unknown): groupId is string =>
        typeof groupId === "string" && mongoose.Types.ObjectId.isValid(groupId),
    );

    let tags: string[] = [...new Set(manualTags)];
    let prunedGroupIds = await pruneGroupIds(manualGroupIds);
    let relatedNoteIds: string[] = [];
    let status: "open" | "archived" = manualStatus ?? "open";

    if (url && !skipCategorize) {
      const resolved = await resolveIncomingCategorization({
        input: {
          title,
          url: metadata?.url,
          description: manualDescription ?? metadata?.description,
          siteName: metadata?.siteName,
          content: manualContent,
        },
        manualTags,
        manualGroupIds,
      });

      tags = resolved.tags;
      prunedGroupIds = resolved.groupIds;
      relatedNoteIds = resolved.relatedNoteIds;
      status = manualStatus ?? status;
    }

    const publishedDate =
      typeof body.publishedDate === "string"
        ? new Date(body.publishedDate)
        : undefined;

    const note = await Note.create({
      title,
      content: manualContent,
      url: metadata?.url,
      description: manualDescription ?? metadata?.description,
      siteName: metadata?.siteName,
      favicon: metadata?.favicon,
      image: metadata?.image,
      publishedDate:
        publishedDate && !Number.isNaN(publishedDate.getTime())
          ? publishedDate
          : undefined,
      tags,
      groupIds: prunedGroupIds,
      status,
      ...(manualClass ? { class: manualClass } : {}),
    });

    await upsertRelatedEdges(note._id, relatedNoteIds);

    const [groups, edges] = await Promise.all([
      NoteGroup.find().sort({ name: 1 }).lean<ILeanNoteGroup[]>().exec(),
      NoteEdge.find({
        $or: [{ from: note._id }, { to: note._id }],
      })
        .lean<ILeanNoteEdge[]>()
        .exec(),
    ]);

    const createdNote = await Note.findById(note._id).lean<ILeanNote>().exec();
    if (!createdNote) {
      throw new Error("Created note could not be reloaded");
    }

    return NextResponse.json(
      {
        note: serializeNote(createdNote),
        groups: groups.map(serializeGroup),
        edges: edges.map(serializeEdge),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to create note" },
      { status: 500 },
    );
  }
}
