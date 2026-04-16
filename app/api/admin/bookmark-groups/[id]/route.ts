import { type NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/require-admin";
import { Bookmark } from "@/models/Bookmark";
import {
  BookmarkGroup,
  type ILeanBookmarkGroup,
} from "@/models/BookmarkGroup";

function serialize(g: ILeanBookmarkGroup) {
  return { ...g, _id: String(g._id) };
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
    if (typeof body.name === "string") update.name = body.name;
    if (typeof body.description === "string") update.description = body.description;
    if (typeof body.color === "string") update.color = body.color;
    if ("parentId" in body) {
      if (body.parentId === null || body.parentId === "") {
        update.parentId = null;
      } else if (
        typeof body.parentId === "string" &&
        mongoose.Types.ObjectId.isValid(body.parentId) &&
        body.parentId !== id
      ) {
        update.parentId = new mongoose.Types.ObjectId(body.parentId);
      }
    }
    const group = await BookmarkGroup.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    })
      .lean<ILeanBookmarkGroup>()
      .exec();
    if (!group) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ group: serialize(group) }, { status: 200 });
  } catch (error) {
    console.error("Error updating group:", error);
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
    const group = await BookmarkGroup.findByIdAndDelete(id);
    if (!group) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const objectId = new mongoose.Types.ObjectId(id);
    await Promise.all([
      Bookmark.updateMany(
        { groupIds: objectId },
        { $pull: { groupIds: objectId } },
      ),
      BookmarkGroup.updateMany(
        { parentId: objectId },
        { $set: { parentId: null } },
      ),
    ]);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting group:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
