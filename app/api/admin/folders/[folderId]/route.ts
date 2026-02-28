import mongoose from "mongoose";
import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/require-admin";
import { Folder } from "@/models/Folder";
import { Note } from "@/models/Notes";

export const DELETE = async (
  request: NextRequest,
  { params }: { params: Promise<{ folderId: string }> },
) => {
  const { folderId } = await params;
  if (!folderId || typeof folderId !== "string") {
    return NextResponse.json({ error: "Invalid folder ID" }, { status: 400 });
  }
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;
    await connectDB();
    const folder = await Folder.findByIdAndDelete(folderId);
    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }
    let childFolders = await Folder.find({ parentFolder: folder._id });
    while (childFolders.length > 0) {
      const childFolder = childFolders.pop();
      if (childFolder) {
        await Folder.findByIdAndDelete(childFolder._id);
        childFolders = childFolders.concat(
          await Folder.find({ parentFolder: childFolder._id }),
        );
      }
    }
    await Note.deleteMany({ _id: { $in: folder.notes } });
    return NextResponse.json(
      { message: "Folder deleted successfully", folder },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting folder:", error);
    return NextResponse.json(
      { error: "Failed to delete folder" },
      { status: 500 },
    );
  }
};

export const PATCH = async (
  request: NextRequest,
  { params }: { params: Promise<{ folderId: string }> },
) => {
  const { folderId } = await params;
  if (!folderId || typeof folderId !== "string") {
    return NextResponse.json({ error: "Invalid folder ID" }, { status: 400 });
  }
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;
    const body = await request.json();
    const { parentId } = body;
    const parentObjectId =
      parentId && parentId !== "null"
        ? new mongoose.Types.ObjectId(parentId)
        : null;
    await connectDB();
    const folder = await Folder.findByIdAndUpdate(
      folderId,
      { parentFolder: parentObjectId },
      { new: true },
    );
    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }
    return NextResponse.json(
      { message: "Folder updated successfully", folder },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating folder:", error);
    return NextResponse.json(
      { error: "Failed to update folder" },
      { status: 500 },
    );
  }
};
