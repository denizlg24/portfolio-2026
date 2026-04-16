import { type NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/require-admin";
import {
  BookmarkGroup,
  type ILeanBookmarkGroup,
} from "@/models/BookmarkGroup";

function serialize(g: ILeanBookmarkGroup) {
  return { ...g, _id: String(g._id) };
}

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  try {
    await connectDB();
    const groups = await BookmarkGroup.find()
      .sort({ name: 1 })
      .lean<ILeanBookmarkGroup[]>()
      .exec();
    return NextResponse.json(
      { groups: groups.map(serialize) },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching groups:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  try {
    const body = await request.json();
    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json({ error: "name required" }, { status: 400 });
    }
    await connectDB();
    const parentId =
      typeof body.parentId === "string" &&
      mongoose.Types.ObjectId.isValid(body.parentId)
        ? new mongoose.Types.ObjectId(body.parentId)
        : null;
    const group = await BookmarkGroup.create({
      name: body.name,
      description: body.description,
      color: body.color,
      parentId,
      autoCreated: false,
    });
    return NextResponse.json(
      {
        group: {
          ...group.toObject(),
          _id: group._id.toString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating group:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed" },
      { status: 500 },
    );
  }
}
