import { requireAdmin } from "@/lib/require-admin";
import { NextRequest, NextResponse } from "next/server";
import { getBoardCards, createCard } from "@/lib/kanban";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const { boardId } = await params;
    const { searchParams } = new URL(request.url);
    const columnId = searchParams.get("columnId") ?? undefined;
    const cards = await getBoardCards(boardId, columnId);
    return NextResponse.json({ cards }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch cards" }, { status: 500 });
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
    const { columnId, title, description, labels, priority, dueDate } = body;

    if (!columnId) {
      return NextResponse.json({ error: "columnId is required" }, { status: 400 });
    }
    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const card = await createCard(boardId, columnId, {
      title,
      description,
      labels,
      priority,
      dueDate,
    });
    return NextResponse.json({ card }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create card" }, { status: 500 });
  }
}
