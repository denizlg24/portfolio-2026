import type { ToolDefinition } from "./types";
import { connectDB } from "@/lib/mongodb";
import { Note } from "@/models/Notes";
import { Folder } from "@/models/Folder";

export const notesTools: ToolDefinition[] = [
  {
    schema: {
      name: "search_notes",
      description:
        "Search notes by a text query. Searches both titles and content. Returns matching notes with their IDs, titles, and a preview of the content.",
      input_schema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query text" },
          limit: {
            type: "number",
            description: "Max number of results to return (default 10)",
          },
        },
        required: ["query"],
      },
    },
    isWrite: false,
    category: "notes",
    execute: async (input) => {
      await connectDB();
      const limit = (input.limit as number) || 10;
      const query = input.query as string;
      const notes = await Note.find(
        { $text: { $search: query } },
        { score: { $meta: "textScore" } },
      )
        .sort({ score: { $meta: "textScore" } })
        .limit(limit)
        .lean();
      return notes.map((n) => ({
        _id: n._id.toString(),
        title: n.title,
        preview: n.content.slice(0, 200),
        updatedAt: n.updatedAt,
      }));
    },
  },
  {
    schema: {
      name: "get_note",
      description: "Get the full content of a note by its ID.",
      input_schema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Note ID" },
        },
        required: ["id"],
      },
    },
    isWrite: false,
    category: "notes",
    execute: async (input) => {
      await connectDB();
      const note = await Note.findById(input.id as string).lean();
      if (!note) throw new Error("Note not found");
      return {
        _id: note._id.toString(),
        title: note.title,
        content: note.content,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      };
    },
  },
  {
    schema: {
      name: "list_folders",
      description:
        "List all note folders and their structure. Returns folder names, IDs, and the notes they contain.",
      input_schema: {
        type: "object",
        properties: {},
      },
    },
    isWrite: false,
    category: "notes",
    execute: async () => {
      await connectDB();
      const folders = await Folder.find()
        .populate("notes", "title")
        .lean();
      return folders.map((f) => ({
        _id: String(f._id),
        name: f.name,
        parentFolder: f.parentFolder ? String(f.parentFolder) : null,
        notes: (f.notes as unknown as { _id: unknown; title: string }[]).map((n) => ({
          _id: String(n._id),
          title: n.title,
        })),
      }));
    },
  },
  {
    schema: {
      name: "create_note",
      description: "Create a new note with a title and content.",
      input_schema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Note title" },
          content: { type: "string", description: "Note content (markdown supported)" },
          folderId: { type: "string", description: "Folder ID to add the note to (optional)" },
        },
        required: ["title", "content"],
      },
    },
    isWrite: true,
    category: "notes",
    execute: async (input) => {
      await connectDB();
      const note = await Note.create({
        title: input.title as string,
        content: input.content as string,
      });
      if (input.folderId) {
        await Folder.findByIdAndUpdate(input.folderId, {
          $push: { notes: note._id },
        });
      }
      return {
        _id: note._id.toString(),
        title: note.title,
        content: note.content,
      };
    },
  },
  {
    schema: {
      name: "update_note",
      description: "Update an existing note's title or content.",
      input_schema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Note ID" },
          title: { type: "string", description: "New title (optional)" },
          content: { type: "string", description: "New content (optional)" },
        },
        required: ["id"],
      },
    },
    isWrite: true,
    category: "notes",
    execute: async (input) => {
      await connectDB();
      const data: Record<string, unknown> = {};
      if (input.title !== undefined) data.title = input.title;
      if (input.content !== undefined) data.content = input.content;
      const note = await Note.findByIdAndUpdate(input.id as string, data, {
        new: true,
      }).lean();
      if (!note) throw new Error("Note not found");
      return {
        _id: note._id.toString(),
        title: note.title,
        content: note.content,
      };
    },
  },
];
