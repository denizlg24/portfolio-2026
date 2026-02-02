import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/require-admin";
import { Folder } from "@/models/Folder";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
export const POST = async (request: NextRequest) => {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;
    const body = await request.json();
    const { name, parentId } = body;
    const parentObjectId =
      parentId && parentId !== "null"
        ? new mongoose.Types.ObjectId(parentId)
        : null;
    await connectDB();
    const foundFolder = await Folder.findOne({
      name,
      parentFolder: parentObjectId,
    });
    if (foundFolder) {
      return NextResponse.json(
        { error: "Folder with the same name already exists in this location." },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Error creating folder:", error);
    return NextResponse.json(
      { error: "Failed to create folder" },
      { status: 500 },
    );
  }
};
