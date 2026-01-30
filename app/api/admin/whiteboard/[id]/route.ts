import {
  getWhiteboardById,
  updateWhiteboard,
  deleteWhiteboard,
} from "@/lib/whiteboard";
import { requireAdmin } from "@/lib/require-admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const { id } = await params;
  const whiteboard = await getWhiteboardById(id);
  if (!whiteboard) {
    return NextResponse.json(
      { error: "Whiteboard not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ whiteboard }, { status: 200 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json();

  const whiteboard = await updateWhiteboard(id, body);
  if (!whiteboard) {
    return NextResponse.json(
      { error: "Failed to update whiteboard" },
      { status: 500 }
    );
  }

  return NextResponse.json({ whiteboard }, { status: 200 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const { id } = await params;
  const success = await deleteWhiteboard(id);
  if (!success) {
    return NextResponse.json(
      { error: "Failed to delete whiteboard" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
