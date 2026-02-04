import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/require-admin";
import { Note } from "@/models/Notes";
import { Folder } from "@/models/Folder";
import { NextRequest, NextResponse } from "next/server";

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
