import { type NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/require-admin";
import { Bookmark, type ILeanBookmark } from "@/models/Bookmark";
import { BookmarkEdge } from "@/models/BookmarkEdge";

function serialize(b: ILeanBookmark) {
  return {
    ...b,
    _id: String(b._id),
    groupIds: (b.groupIds || []).map(String),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  try {
    const { id } = await params;
    await connectDB();
    const bookmark = await Bookmark.findById(id).lean<ILeanBookmark>().exec();
    if (!bookmark) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ bookmark: serialize(bookmark) }, { status: 200 });
  } catch (error) {
    console.error("Error fetching bookmark:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  try {
    const { id } = await params;
    const body = await request.json();
    await connectDB();

    const update: Record<string, unknown> = {};
    if (Array.isArray(body.tags)) update.tags = body.tags;
    if (Array.isArray(body.groupIds)) {
      update.groupIds = body.groupIds
        .filter((g: unknown): g is string =>
          typeof g === "string" && mongoose.Types.ObjectId.isValid(g),
        )
        .map((g: string) => new mongoose.Types.ObjectId(g));
    }
    if (typeof body.userNotes === "string") update.userNotes = body.userNotes;
    if (typeof body.title === "string") update.title = body.title;
    if (typeof body.description === "string") update.description = body.description;

    const bookmark = await Bookmark.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    })
      .lean<ILeanBookmark>()
      .exec();

    if (!bookmark) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ bookmark: serialize(bookmark) }, { status: 200 });
  } catch (error) {
    console.error("Error updating bookmark:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  try {
    const { id } = await params;
    await connectDB();
    const bookmark = await Bookmark.findByIdAndDelete(id);
    if (!bookmark) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await BookmarkEdge.deleteMany({
      $or: [{ from: bookmark._id }, { to: bookmark._id }],
    });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting bookmark:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
