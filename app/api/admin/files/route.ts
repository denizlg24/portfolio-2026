import mongoose from "mongoose";
import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/require-admin";
import { Folder } from "@/models/Folder";
import { type INote, Note } from "@/models/Notes";

interface FileItem {
  type: "folder" | "note";
  _id: string;
  name: string;
  updatedAt: string;
}

interface BreadcrumbItem {
  folderId: string;
  folderName: string;
}

export const GET = async (request: NextRequest) => {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") ?? "dateAsc";

    await connectDB();

    let items: FileItem[] = [];
    let breadcrumbs: BreadcrumbItem[] = [];

    if (folderId) {
      // Fetch contents of a specific folder
      const parentFolder = new mongoose.Types.ObjectId(folderId);
      const folder = await Folder.findById(folderId)
        .populate<{ notes: INote[] }>("notes")
        .lean();

      if (!folder) {
        return NextResponse.json(
          { error: "Folder not found" },
          { status: 404 },
        );
      }

      // Build breadcrumb trail
      let currentDir = folder.name;
      let parentFolderId = folder.parentFolder;
      breadcrumbs = [{ folderName: currentDir, folderId: folderId }];
      while (parentFolderId) {
        const parentFolderDoc = await Folder.findById(parentFolderId).lean();
        if (parentFolderDoc) {
          currentDir = parentFolderDoc.name;
          breadcrumbs.unshift({
            folderName: parentFolderDoc.name,
            folderId: parentFolderDoc._id.toString(),
          });
          parentFolderId = parentFolderDoc.parentFolder;
        } else {
          break;
        }
      }

      const folders = search
        ? await Folder.find(
            { parentFolder: parentFolder, $text: { $search: search } },
            { score: { $meta: "textScore" } },
          )
            .sort({ score: { $meta: "textScore" } })
            .lean()
        : await Folder.find({ parentFolder: parentFolder }).lean();

      const notes = search
        ? (
            await Note.find(
              { $text: { $search: search } },
              { score: { $meta: "textScore" } },
            )
              .sort({ score: { $meta: "textScore" } })
              .lean()
          ).filter((n) =>
            folder.notes.some((fn) => fn._id.toString() === n._id.toString()),
          )
        : folder.notes;

      items = [
        ...folders.map((f) => ({
          type: "folder" as const,
          _id: f._id.toString(),
          name: f.name,
          updatedAt: f.updatedAt.toISOString(),
        })),
        ...notes.map((n) => ({
          type: "note" as const,
          _id: n._id.toString(),
          name: n.title,
          updatedAt: n.updatedAt.toISOString(),
        })),
      ];
    } else {
      // Fetch root folders (no parent)
      const folders = search
        ? await Folder.find(
            { parentFolder: null, $text: { $search: search } },
            { score: { $meta: "textScore" } },
          )
            .sort({ score: { $meta: "textScore" } })
            .lean()
        : await Folder.find({ parentFolder: null }).lean();

      items = folders.map((f) => ({
        type: "folder" as const,
        _id: f._id.toString(),
        name: f.name,
        updatedAt: f.updatedAt.toISOString(),
      }));
    }

    // Sort items
    items.sort((a, b) => {
      if (sort === "nameAsc") {
        return a.name.localeCompare(b.name);
      } else if (sort === "nameDesc") {
        return b.name.localeCompare(a.name);
      } else if (sort === "dateAsc") {
        return (
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        );
      } else if (sort === "dateDesc") {
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      }
      return 0;
    });

    return NextResponse.json({ items, breadcrumbs }, { status: 200 });
  } catch (error) {
    console.error("Error fetching files:", error);
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 },
    );
  }
};
