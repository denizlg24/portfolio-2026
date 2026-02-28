import type Anthropic from "@anthropic-ai/sdk";
import { type NextRequest, NextResponse } from "next/server";
import {
  getConversation,
  updateConversationMessages,
} from "@/lib/conversations";
import { createAgenticSSEStream } from "@/lib/llm-chat";
import { checkRateLimit } from "@/lib/rate-limit";
import { requireAdmin } from "@/lib/require-admin";
import { getToolSchemas } from "@/lib/tools/registry";
import { buildSystemPrompt } from "@/lib/tools/system-prompt";

export const maxDuration = 300;

export const POST = async (req: NextRequest) => {
  const adminError = await requireAdmin(req);
  if (adminError) return adminError;

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed, remaining, resetMs } = await checkRateLimit(`chat:${ip}`, {
    maxRequests: 10,
  });

  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(resetMs / 1000)),
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  try {
    const {
      conversationId,
      message,
      model = "claude-sonnet-4-5-20250929",
      toolsEnabled = true,
      webSearchEnabled = false,
      toolApprovals,
    } = await req.json();

    if (message && toolApprovals) {
      return NextResponse.json(
        { error: "Cannot provide both message and toolApprovals" },
        { status: 400 },
      );
    }
    if (!message && !toolApprovals) {
      return NextResponse.json(
        { error: "Either message or toolApprovals is required" },
        { status: 400 },
      );
    }
    if (toolApprovals && !conversationId) {
      return NextResponse.json(
        { error: "conversationId is required for tool continuations" },
        { status: 400 },
      );
    }

    const messages: Anthropic.MessageParam[] = [];

    if (conversationId) {
      const conversation = await getConversation(conversationId);
      if (conversation) {
        for (const msg of conversation.messages) {
          messages.push({
            role: msg.role,
            content: msg.content as string | Anthropic.ContentBlockParam[],
          });
        }
      }
    }

    if (message) {
      const userContent: string | Anthropic.ContentBlockParam[] =
        typeof message === "string" ? message : message;
      messages.push({ role: "user", content: userContent });
    }

    const tools: Anthropic.Tool[] = [];
    if (toolsEnabled) {
      const schemas = getToolSchemas();
      for (const schema of schemas) {
        tools.push({
          name: schema.name,
          description: schema.description,
          input_schema: schema.input_schema as Anthropic.Tool.InputSchema,
        });
      }
    }

    if (webSearchEnabled) {
      tools.push({
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 5,
      } as unknown as Anthropic.Tool);
    }

    const system = buildSystemPrompt();

    const onPersist = async (
      msgs: Anthropic.MessageParam[],
      tokenUsage?: {
        inputTokens: number;
        outputTokens: number;
        costUsd: number;
      },
    ) => {
      if (!conversationId) return;

      const messagesToStore = msgs.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
        ...(tokenUsage && m === msgs[msgs.length - 1] && m.role === "assistant"
          ? { tokenUsage }
          : {}),
        createdAt: new Date(),
      }));

      await updateConversationMessages(conversationId, messagesToStore);
    };

    const sseStream = createAgenticSSEStream({
      system,
      messages,
      model,
      tools: tools.length > 0 ? tools : undefined,
      source: "dashboard-chat",
      toolApprovals,
      onPersist,
    });

    return new Response(sseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-RateLimit-Remaining": String(remaining),
      },
    });
  } catch (error) {
    console.error("Chat route error:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 },
    );
  }
};
