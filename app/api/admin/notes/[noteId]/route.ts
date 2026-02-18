import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/require-admin";
import { Note } from "@/models/Notes";
import { Folder } from "@/models/Folder";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> },
) => {
  const { noteId } = await params;
  if (!noteId || typeof noteId !== "string") {
    return NextResponse.json({ error: "Invalid note ID" }, { status: 400 });
  }
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;
    await connectDB();
    const note = await Note.findById(noteId).lean();
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }
    return NextResponse.json({ note }, { status: 200 });
  } catch (error) {
    console.error("Error fetching note:", error);
    return NextResponse.json(
      { error: "Failed to fetch note" },
      { status: 500 },
    );
  }
};

export const PUT = async (
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> },
) => {
  const { noteId } = await params;
  if (!noteId || typeof noteId !== "string") {
    return NextResponse.json({ error: "Invalid note ID" }, { status: 400 });
  }
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;
    const body = await request.json();
    const { content } = body;
    await connectDB();
    const note = await Note.findByIdAndUpdate(
      noteId,
      { content },
      { new: true },
    );
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }
    return NextResponse.json(
      { message: "Note updated successfully", note },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating note:", error);
    return NextResponse.json(
      { error: "Failed to update note" },
      { status: 500 },
    );
  }
};

export const PATCH = async (
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> },
) => {
  const { noteId } = await params;
  if (!noteId || typeof noteId !== "string") {
    return NextResponse.json({ error: "Invalid note ID" }, { status: 400 });
  }
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;
    const body = await request.json();
    const { parentId } = body;
    await connectDB();
    const note = await Note.findByIdAndUpdate(
      noteId,
      { folder: parentId },
      { new: true },
    );
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }
    return NextResponse.json(
      { message: "Note updated successfully", note },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating note:", error);
    return NextResponse.json(
      { error: "Failed to update note" },
      { status: 500 },
    );
  }
};

export const DELETE = async (
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> },
) => {
  const { noteId } = await params;
  if (!noteId || typeof noteId !== "string") {
    return NextResponse.json({ error: "Invalid note ID" }, { status: 400 });
  }
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;
    await connectDB();
    const note = await Note.findByIdAndDelete(noteId);
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }
    await Folder.findOneAndUpdate(
      { notes: note._id },
      { $pull: { notes: note._id } },
    );
    return NextResponse.json(
      { message: "Note deleted successfully", note },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 },
    );
  }
};
