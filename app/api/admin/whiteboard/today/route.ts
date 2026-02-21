import {
  clearTodayBoard,
  getTodayBoard,
  updateTodayBoard,
} from "@/lib/whiteboard";
import { requireAdmin } from "@/lib/require-admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest
) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  
  const whiteboard = await getTodayBoard();
  if (!whiteboard) {
    return NextResponse.json(
      { error: "Whiteboard not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ whiteboard }, { status: 200 });
}

export async function PUT(
  request: NextRequest
) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  
  const body = await request.json();

  const whiteboard = await updateTodayBoard(body);
  if (!whiteboard) {
    return NextResponse.json(
      { error: "Failed to update whiteboard" },
      { status: 500 }
    );
  }

  return NextResponse.json({ whiteboard }, { status: 200 });
}

export async function DELETE(
  request: NextRequest
) {
  const authError = await requireAdmin(request);
  if (authError) return authError;


  const success = await clearTodayBoard();
  if (!success) {
    return NextResponse.json(
      { error: "Failed to clear Today board" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
