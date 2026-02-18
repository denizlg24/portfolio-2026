import { requireAdmin } from "@/lib/require-admin";
import { NextRequest, NextResponse } from "next/server";
import { getBoardColumns, createColumn } from "@/lib/kanban";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const { boardId } = await params;
    const columns = await getBoardColumns(boardId);
    return NextResponse.json({ columns }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch columns" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const { boardId } = await params;
    const body = await request.json();
    const { title, color, wipLimit } = body;

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const column = await createColumn(boardId, { title, color, wipLimit });
    return NextResponse.json({ column }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create column" }, { status: 500 });
  }
}
