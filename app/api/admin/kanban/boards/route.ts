import { requireAdmin } from "@/lib/require-admin";
import { NextRequest, NextResponse } from "next/server";
import { getAllBoards, createBoard } from "@/lib/kanban";

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const boards = await getAllBoards();
    return NextResponse.json({ boards }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch boards" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { title, description, color } = body;

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const board = await createBoard({ title, description, color });
    return NextResponse.json({ board }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create board" }, { status: 500 });
  }
}
