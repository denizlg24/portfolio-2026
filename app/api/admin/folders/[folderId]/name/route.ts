import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/require-admin";
import { Folder } from "@/models/Folder";
import { NextRequest, NextResponse } from "next/server";

export const PUT = async (
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
    const { name } = body;
    await connectDB();
    const folder = await Folder.findByIdAndUpdate(
      folderId,
      { name: name },
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
      { error: "Failed to update note" },
      { status: 500 },
    );
  }
};
