import { requireAdmin } from "@/lib/require-admin";
import { NextRequest, NextResponse } from "next/server";
import { getAllConversations, createConversation } from "@/lib/conversations";

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const conversations = await getAllConversations();
    return NextResponse.json({ conversations }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { title, model: llmModel } = body;

    if (!title || !llmModel) {
      return NextResponse.json(
        { error: "title and model are required" },
        { status: 400 },
      );
    }

    const conversation = await createConversation({ title, llmModel });
    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 },
    );
  }
}
