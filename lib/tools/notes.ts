import { connectDB } from "@/lib/mongodb";
import { Folder } from "@/models/Folder";
import { Note } from "@/models/Notes";
import type { ToolDefinition } from "./types";

export const notesTools: ToolDefinition[] = [
  // ── Folders ─────────────────────────────────────────────

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
      const folders = await Folder.find().populate("notes", "title").lean();
      return folders.map((f) => ({
        _id: String(f._id),
        name: f.name,
        parentFolder: f.parentFolder ? String(f.parentFolder) : null,
        notes: (f.notes as unknown as { _id: unknown; title: string }[]).map(
          (n) => ({
            _id: String(n._id),
            title: n.title,
          }),
        ),
      }));
    },
  },
  {
    schema: {
      name: "create_folder",
      description:
        "Create a new folder for organizing notes. Can be a root folder or nested inside another folder.",
      input_schema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Folder name" },
          parentFolderId: {
            type: "string",
            description:
              "Parent folder ID to nest this folder under (optional, omit for root folder)",
          },
        },
        required: ["name"],
      },
    },
    isWrite: true,
    category: "notes",
    execute: async (input) => {
      await connectDB();
      const data: Record<string, unknown> = { name: input.name as string };
      if (input.parentFolderId) data.parentFolder = input.parentFolderId;
      const folder = await Folder.create(data);
      return {
        _id: folder._id.toString(),
        name: folder.name,
        parentFolder: folder.parentFolder ? String(folder.parentFolder) : null,
      };
    },
  },
  {
    schema: {
      name: "update_folder",
      description:
        "Rename a folder or move it under a different parent folder.",
      input_schema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Folder ID" },
          name: { type: "string", description: "New folder name (optional)" },
          parentFolderId: {
            type: "string",
            description:
              "New parent folder ID (optional, set to null for root)",
          },
        },
        required: ["id"],
      },
    },
    isWrite: true,
    category: "notes",
    execute: async (input) => {
      await connectDB();
      const data: Record<string, unknown> = {};
      if (input.name !== undefined) data.name = input.name;
      if (input.parentFolderId !== undefined)
        data.parentFolder = input.parentFolderId || null;
      const folder = await Folder.findByIdAndUpdate(input.id as string, data, {
        new: true,
      }).lean();
      if (!folder) throw new Error("Folder not found");
      return {
        _id: String(folder._id),
        name: folder.name,
        parentFolder: folder.parentFolder ? String(folder.parentFolder) : null,
      };
    },
  },
  {
    schema: {
      name: "delete_folder",
      description:
        "Delete a folder by its ID. Notes inside the folder are not deleted, only removed from the folder.",
      input_schema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Folder ID" },
        },
        required: ["id"],
      },
    },
    isWrite: true,
    category: "notes",
    execute: async (input) => {
      await connectDB();
      const folder = await Folder.findByIdAndDelete(input.id as string);
      if (!folder) throw new Error("Folder not found");
      return { success: true };
    },
  },

  // ── Notes ───────────────────────────────────────────────

  {
    schema: {
      name: "list_notes",
      description:
        "List all notes with their titles and last-updated timestamps. Supports pagination.",
      input_schema: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Max number of notes to return (default 20)",
          },
          offset: {
            type: "number",
            description: "Number of notes to skip for pagination (default 0)",
          },
        },
      },
    },
    isWrite: false,
    category: "notes",
    execute: async (input) => {
      await connectDB();
      const limit = (input.limit as number) || 20;
      const offset = (input.offset as number) || 0;
      const notes = await Note.find()
        .sort({ updatedAt: -1 })
        .skip(offset)
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
      name: "create_note",
      description: "Create a new note with a title and content.",
      input_schema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Note title" },
          content: {
            type: "string",
            description: "Note content (markdown supported)",
          },
          folderId: {
            type: "string",
            description: "Folder ID to add the note to (optional)",
          },
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
  {
    schema: {
      name: "delete_note",
      description: "Delete a note by its ID.",
      input_schema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Note ID" },
        },
        required: ["id"],
      },
    },
    isWrite: true,
    category: "notes",
    execute: async (input) => {
      await connectDB();
      const note = await Note.findByIdAndDelete(input.id as string);
      if (!note) throw new Error("Note not found");
      await Folder.updateMany(
        { notes: note._id },
        { $pull: { notes: note._id } },
      );
      return { success: true };
    },
  },
  {
    schema: {
      name: "move_note_to_folder",
      description:
        "Move a note into a folder, or remove it from its current folder. Handles removing the note from any previous folder automatically.",
      input_schema: {
        type: "object",
        properties: {
          noteId: { type: "string", description: "Note ID" },
          folderId: {
            type: "string",
            description:
              "Target folder ID (omit or set to null to remove from all folders)",
          },
        },
        required: ["noteId"],
      },
    },
    isWrite: true,
    category: "notes",
    execute: async (input) => {
      await connectDB();
      const noteId = input.noteId as string;
      const note = await Note.findById(noteId).lean();
      if (!note) throw new Error("Note not found");

      await Folder.updateMany({ notes: noteId }, { $pull: { notes: noteId } });

      if (input.folderId) {
        const folder = await Folder.findByIdAndUpdate(
          input.folderId as string,
          { $addToSet: { notes: noteId } },
          { new: true },
        ).lean();
        if (!folder) throw new Error("Folder not found");
        return {
          success: true,
          noteId,
          folderId: String(folder._id),
          folderName: folder.name,
        };
      }

      return { success: true, noteId, folderId: null };
    },
  },
];
