import { requireAdmin } from "@/lib/require-admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { getConversation, appendMessages } from "@/lib/conversations";
import { createAgenticSSEStream } from "@/lib/llm-chat";
import { buildSystemPrompt } from "@/lib/tools/system-prompt";
import { getToolSchemas } from "@/lib/tools/registry";
import type Anthropic from "@anthropic-ai/sdk";

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
      confirmedActions,
    } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "message is required" },
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

    const userContent: string | Anthropic.ContentBlockParam[] =
      typeof message === "string" ? message : message;
    messages.push({ role: "user", content: userContent });

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

    const sseStream = createAgenticSSEStream({
      system,
      messages,
      model,
      tools: tools.length > 0 ? tools : undefined,
      source: "dashboard-chat",
      confirmedActions,
    });

    const persistStream = new ReadableStream({
      async start(controller) {
        const reader = sseStream.getReader();
        const assistantTextChunks: string[] = [];
        let doneUsage: {
          inputTokens: number;
          outputTokens: number;
          costUsd: number;
        } | null = null;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            controller.enqueue(value);

            const text = new TextDecoder().decode(value);
            const lines = text.split("\n");
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              try {
                const event = JSON.parse(line.slice(6));
                if (event.type === "delta") {
                  assistantTextChunks.push(event.text);
                } else if (event.type === "done") {
                  doneUsage = event.usage;
                }
              } catch {}
            }
          }

          controller.close();

          if (conversationId) {
            const assistantContent = assistantTextChunks.join("");
            const messagesToPersist = [
              {
                role: "user" as const,
                content: userContent,
                createdAt: new Date(),
              },
              {
                role: "assistant" as const,
                content: assistantContent,
                tokenUsage: doneUsage
                  ? {
                      inputTokens: doneUsage.inputTokens,
                      outputTokens: doneUsage.outputTokens,
                      costUsd: doneUsage.costUsd,
                    }
                  : undefined,
                createdAt: new Date(),
              },
            ];
            appendMessages(conversationId, messagesToPersist).catch((err) => {
              console.error("Failed to persist chat messages:", err);
            });
          }
        } catch (err) {
          try {
            controller.close();
          } catch {}
        }
      },
    });

    return new Response(persistStream, {
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
