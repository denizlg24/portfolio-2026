import type Anthropic from "@anthropic-ai/sdk";
import { APIError } from "@anthropic-ai/sdk";
import {
  anthropic,
  type CacheUsage,
  calculateCost,
  getMaxTokens,
  logLlmUsage,
  supportsAdaptiveThinking,
} from "@/lib/llm";
import { getToolByName, isWriteTool } from "@/lib/tools/registry";
import type { TokenUsage } from "@/models/Conversation";

const MAX_ITERATIONS = 15;
const MAX_RATE_LIMIT_RETRIES = 3;
const BASE_BACKOFF_MS = 15_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryAfterMs(err: unknown, attempt: number): number {
  if (err instanceof APIError && err.headers) {
    const retryAfter = err.headers["retry-after"];
    if (retryAfter) {
      const seconds = Number.parseFloat(retryAfter);
      if (!Number.isNaN(seconds)) return Math.ceil(seconds) * 1000;
    }
  }
  // Exponential backoff if no Retry-After header
  return BASE_BACKOFF_MS * 2 ** attempt;
}

function isRetryableError(err: unknown): boolean {
  return err instanceof APIError && (err.status === 429 || err.status === 529);
}

interface ToolRunResult {
  content: string;
  isError: boolean;
  toolResult: Anthropic.ToolResultBlockParam;
}

async function runTool(toolUse: Anthropic.ToolUseBlock): Promise<ToolRunResult> {
  const tool = getToolByName(toolUse.name);
  if (!tool) {
    const msg = `Error: Tool "${toolUse.name}" not found.`;
    return {
      content: msg,
      isError: true,
      toolResult: {
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: msg,
        is_error: true,
      },
    };
  }

  try {
    const result = await tool.execute(toolUse.input as Record<string, unknown>);
    const content = JSON.stringify(result);
    return {
      content,
      isError: false,
      toolResult: {
        type: "tool_result",
        tool_use_id: toolUse.id,
        content,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Tool execution failed";
    return {
      content: msg,
      isError: true,
      toolResult: {
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: msg,
        is_error: true,
      },
    };
  }
}

function deniedResult(
  toolUse: Anthropic.ToolUseBlock,
): Anthropic.ToolResultBlockParam {
  return {
    type: "tool_result",
    tool_use_id: toolUse.id,
    content: "User denied this action.",
    is_error: true,
  };
}

interface AgenticStreamParams {
  system: string;
  messages: Anthropic.MessageParam[];
  model: string;
  tools?: Anthropic.ToolUnion[];
  source: string;
  toolApprovals?: Record<string, boolean>;
  onPersist?: (
    messages: Anthropic.MessageParam[],
    tokenUsage?: TokenUsage,
  ) => Promise<void>;
}

export function createAgenticSSEStream({
  system,
  messages,
  model,
  tools,
  source,
  toolApprovals,
  onPersist,
}: AgenticStreamParams): ReadableStream {
  const encoder = new TextEncoder();
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCacheCreationInputTokens = 0;
  let totalCacheReadInputTokens = 0;
  let iterations = 0;
  let activeStream: ReturnType<typeof anthropic.messages.stream> | null = null;
  let aborted = false;

  return new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        if (aborted) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
          );
        } catch (err) {
          console.warn("SSE enqueue failed:", err);
        }
      };

      const safePersist = async (
        msgs: Anthropic.MessageParam[],
        usage?: TokenUsage,
      ) => {
        if (!onPersist) return;
        try {
          await onPersist(msgs, usage);
        } catch (err) {
          console.error("onPersist failed:", err);
          send({
            type: "persist_warning",
            error: err instanceof Error ? err.message : "Persist failed",
          });
        }
      };

      const flushUsageLog = (extra?: { final: boolean }) => {
        const cacheUsage: CacheUsage = {
          cacheCreationInputTokens: totalCacheCreationInputTokens,
          cacheReadInputTokens: totalCacheReadInputTokens,
        };
        const costUsd = calculateCost(
          model,
          totalInputTokens,
          totalOutputTokens,
          cacheUsage,
        );
        logLlmUsage({
          llmModel: model,
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          costUsd,
          systemPrompt: system,
          userPrompt: source,
          source,
        });
        return { cacheUsage, costUsd, final: extra?.final ?? false };
      };

      try {
        const workingMessages = [...messages];

        // ===== Resume path: process tool approvals from a paused turn =====
        if (toolApprovals) {
          const lastAssistant = workingMessages[workingMessages.length - 1];
          if (
            lastAssistant?.role !== "assistant" ||
            !Array.isArray(lastAssistant.content)
          ) {
            send({
              type: "error",
              error: "Invalid state for tool continuation",
            });
            controller.close();
            return;
          }

          const toolUseBlocks = (
            lastAssistant.content as Anthropic.ContentBlockParam[]
          ).filter(
            (block): block is Anthropic.ToolUseBlock =>
              block.type === "tool_use",
          );

          const toolResults: Anthropic.ToolResultBlockParam[] = [];

          for (const toolUse of toolUseBlocks) {
            const needsApproval = isWriteTool(toolUse.name);
            const approved = !needsApproval || toolApprovals[toolUse.id] === true;

            if (!approved) {
              const denied = deniedResult(toolUse);
              send({
                type: "tool_result",
                toolId: toolUse.id,
                toolName: toolUse.name,
                result: denied.content,
                isError: true,
              });
              toolResults.push(denied);
              continue;
            }

            const { content, isError, toolResult } = await runTool(toolUse);
            send({
              type: "tool_result",
              toolId: toolUse.id,
              toolName: toolUse.name,
              result: content,
              isError,
            });
            toolResults.push(toolResult);
          }

          workingMessages.push({ role: "user", content: toolResults });
        }

        // ===== Main agentic loop =====
        const useThinking = supportsAdaptiveThinking(model);
        const cachedSystem: Anthropic.TextBlockParam[] = [
          {
            type: "text",
            text: system,
            cache_control: { type: "ephemeral" },
          },
        ];

        while (iterations < MAX_ITERATIONS) {
          if (aborted) return;
          iterations++;

          const maxTokens = getMaxTokens(model);
          let streamStarted = false;

          for (
            let rateLimitAttempt = 0;
            rateLimitAttempt <= MAX_RATE_LIMIT_RETRIES;
            rateLimitAttempt++
          ) {
            try {
              activeStream = anthropic.messages.stream({
                model: model as Anthropic.Model,
                max_tokens: maxTokens,
                system: cachedSystem,
                messages: workingMessages,
                cache_control: { type: "ephemeral" },
                ...(useThinking
                  ? { thinking: { type: "adaptive" as const } }
                  : {}),
                ...(tools?.length ? { tools } : {}),
              });

              // Force the stream to connect so rate limit errors surface early
              await activeStream.emitted("connect");
              streamStarted = true;
              break;
            } catch (err) {
              if (
                isRetryableError(err) &&
                rateLimitAttempt < MAX_RATE_LIMIT_RETRIES
              ) {
                const retryAfterMs = getRetryAfterMs(err, rateLimitAttempt);
                send({
                  type: "rate_limit_backoff",
                  retryAfterMs,
                  attempt: rateLimitAttempt + 1,
                  maxAttempts: MAX_RATE_LIMIT_RETRIES,
                });
                await sleep(retryAfterMs);
                continue;
              }
              throw err;
            }
          }

          if (!streamStarted || !activeStream) {
            send({
              type: "error",
              error: "Rate limit exceeded after maximum retries",
            });
            controller.close();
            return;
          }

          const stream = activeStream;
          const toolInputBuffers = new Map<number, string>();

          for await (const event of stream) {
            if (aborted) return;
            switch (event.type) {
              case "content_block_start": {
                const block = event.content_block;
                if (block.type === "tool_use") {
                  send({
                    type: "tool_call_start",
                    toolName: block.name,
                    toolId: block.id,
                  });
                  toolInputBuffers.set(event.index, "");
                }
                break;
              }
              case "content_block_delta": {
                const delta = event.delta;
                if (delta.type === "text_delta") {
                  send({ type: "delta", text: delta.text });
                } else if (delta.type === "input_json_delta") {
                  const partial = delta.partial_json;
                  const prev = toolInputBuffers.get(event.index) ?? "";
                  toolInputBuffers.set(event.index, prev + partial);
                  send({
                    type: "tool_input_delta",
                    toolId: event.index,
                    delta: partial,
                  });
                }
                break;
              }
              default:
                break;
            }
          }

          const finalMessage = await stream.finalMessage();
          activeStream = null;

          totalInputTokens += finalMessage.usage.input_tokens;
          totalOutputTokens += finalMessage.usage.output_tokens;
          totalCacheCreationInputTokens +=
            finalMessage.usage.cache_creation_input_tokens ?? 0;
          totalCacheReadInputTokens +=
            finalMessage.usage.cache_read_input_tokens ?? 0;

          // Debug: warn if cache reads are zero across multiple iterations
          // (silent invalidator hunting)
          if (iterations > 1 && totalCacheReadInputTokens === 0) {
            console.warn(
              `[llm-chat] Zero cache reads after ${iterations} iterations — check for prefix invalidators`,
            );
          }

          for (const block of finalMessage.content) {
            if (block.type === "tool_use") {
              send({
                type: "tool_call_complete",
                toolId: block.id,
                toolName: block.name,
                input: block.input as Record<string, unknown>,
              });
            }
          }

          workingMessages.push({
            role: "assistant",
            content: finalMessage.content,
          });

          if (finalMessage.stop_reason !== "tool_use") break;

          // ===== Handle tool calls =====
          const toolUseBlocks: Anthropic.ToolUseBlock[] = [];
          for (const block of finalMessage.content) {
            if (block.type === "tool_use") toolUseBlocks.push(block);
          }
          const readTools = toolUseBlocks.filter(
            (t: Anthropic.ToolUseBlock) => !isWriteTool(t.name),
          );
          const writeTools = toolUseBlocks.filter(
            (t: Anthropic.ToolUseBlock) => isWriteTool(t.name),
          );

          // If any writes present, execute reads now and pause for approval
          if (writeTools.length > 0) {
            const toolResults: Anthropic.ToolResultBlockParam[] = [];

            for (const toolUse of readTools) {
              send({
                type: "tool_call",
                toolName: toolUse.name,
                toolId: toolUse.id,
                input: toolUse.input as Record<string, unknown>,
              });
              const { content, isError, toolResult } = await runTool(toolUse);
              send({
                type: "tool_result",
                toolId: toolUse.id,
                toolName: toolUse.name,
                result: content,
                isError,
              });
              toolResults.push(toolResult);
            }

            for (const toolUse of writeTools) {
              send({
                type: "tool_call",
                toolName: toolUse.name,
                toolId: toolUse.id,
                input: toolUse.input as Record<string, unknown>,
              });
              send({
                type: "tool_confirmation_required",
                toolId: toolUse.id,
                toolName: toolUse.name,
                input: toolUse.input as Record<string, unknown>,
              });
            }

            await safePersist(workingMessages);
            send({ type: "paused", readResults: toolResults });
            controller.close();
            flushUsageLog({ final: false });
            return;
          }

          // Otherwise run all tools and continue the loop
          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          for (const toolUse of toolUseBlocks) {
            send({
              type: "tool_call",
              toolName: toolUse.name,
              toolId: toolUse.id,
              input: toolUse.input as Record<string, unknown>,
            });
            const { content, isError, toolResult } = await runTool(toolUse);
            send({
              type: "tool_result",
              toolId: toolUse.id,
              toolName: toolUse.name,
              result: content,
              isError,
            });
            toolResults.push(toolResult);
          }
          workingMessages.push({ role: "user", content: toolResults });
        }

        // ===== Loop exited =====
        const hitMaxIterations = iterations >= MAX_ITERATIONS;
        if (hitMaxIterations) {
          // Check if last assistant message still has unanswered tool_use
          const last = workingMessages[workingMessages.length - 1];
          const hasUnansweredTools =
            last?.role === "assistant" &&
            Array.isArray(last.content) &&
            last.content.some(
              (b: Anthropic.ContentBlockParam) => b.type === "tool_use",
            );
          send({
            type: "max_iterations_reached",
            iterations,
            hasUnansweredTools,
          });
        }

        const { cacheUsage, costUsd } = flushUsageLog({ final: true });

        await safePersist(workingMessages, {
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          costUsd,
        });

        send({
          type: "done",
          usage: {
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
            cacheCreationInputTokens: cacheUsage.cacheCreationInputTokens,
            cacheReadInputTokens: cacheUsage.cacheReadInputTokens,
            costUsd,
            model,
            iterations,
          },
        });

        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Stream error";
        console.error("Agentic stream error:", err);
        if (
          err &&
          typeof err === "object" &&
          "status" in err &&
          "error" in err
        ) {
          console.error(
            "Anthropic API error details:",
            JSON.stringify((err as { error: unknown }).error, null, 2),
          );
        }
        try {
          send({ type: "error", error: message });
          controller.close();
        } catch (closeErr) {
          console.warn("Failed to close controller after error:", closeErr);
        }
      }
    },
    cancel() {
      aborted = true;
      activeStream?.abort();
      activeStream = null;
    },
  });
}
