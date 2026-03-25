import type Anthropic from "@anthropic-ai/sdk";
import { APIError } from "@anthropic-ai/sdk";
import { anthropic, calculateCost, getMaxTokens, logLlmUsage, type CacheUsage } from "@/lib/llm";
import { getToolByName, isWriteTool } from "@/lib/tools/registry";
import type { TokenUsage } from "@/models/Conversation";

const MAX_ITERATIONS = 15;
const MAX_RATE_LIMIT_RETRIES = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryAfterMs(err: unknown): number {
  if (err instanceof APIError && err.headers) {
    const retryAfter = err.headers["retry-after"];
    if (retryAfter) {
      const seconds = Number.parseFloat(retryAfter);
      if (!Number.isNaN(seconds)) return Math.ceil(seconds) * 1000;
    }
  }
  return 15_000;
}

function isRateLimitError(err: unknown): boolean {
  return err instanceof APIError && err.status === 429;
}

function isOverloadedError(err: unknown): boolean {
  return err instanceof APIError && err.status === 529;
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

  return new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
          );
        } catch {}
      };

      try {
        const workingMessages = [...messages];

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
            lastAssistant.content as Anthropic.ContentBlock[]
          ).filter(
            (block): block is Anthropic.ToolUseBlock =>
              block.type === "tool_use",
          );

          const toolResults: Anthropic.ToolResultBlockParam[] = [];

          for (const toolUse of toolUseBlocks) {
            const toolName = toolUse.name;
            const toolId = toolUse.id;
            const toolInput = toolUse.input as Record<string, unknown>;

            if (!isWriteTool(toolName)) {
              const tool = getToolByName(toolName);
              if (!tool) {
                toolResults.push({
                  type: "tool_result",
                  tool_use_id: toolId,
                  content: `Error: Tool "${toolName}" not found.`,
                  is_error: true,
                });
                continue;
              }

              try {
                const result = await tool.execute(toolInput);
                const resultStr = JSON.stringify(result);
                send({
                  type: "tool_result",
                  toolId,
                  toolName,
                  result: resultStr,
                  isError: false,
                });
                toolResults.push({
                  type: "tool_result",
                  tool_use_id: toolId,
                  content: resultStr,
                });
              } catch (err) {
                const errMsg =
                  err instanceof Error ? err.message : "Tool execution failed";
                send({
                  type: "tool_result",
                  toolId,
                  toolName,
                  result: errMsg,
                  isError: true,
                });
                toolResults.push({
                  type: "tool_result",
                  tool_use_id: toolId,
                  content: errMsg,
                  is_error: true,
                });
              }
            } else if (toolApprovals[toolId] === true) {
              const tool = getToolByName(toolName);
              if (!tool) {
                toolResults.push({
                  type: "tool_result",
                  tool_use_id: toolId,
                  content: `Error: Tool "${toolName}" not found.`,
                  is_error: true,
                });
                continue;
              }

              try {
                const result = await tool.execute(toolInput);
                const resultStr = JSON.stringify(result);
                send({
                  type: "tool_result",
                  toolId,
                  toolName,
                  result: resultStr,
                  isError: false,
                });
                toolResults.push({
                  type: "tool_result",
                  tool_use_id: toolId,
                  content: resultStr,
                });
              } catch (err) {
                const errMsg =
                  err instanceof Error ? err.message : "Execution failed";
                send({
                  type: "tool_result",
                  toolId,
                  toolName,
                  result: errMsg,
                  isError: true,
                });
                toolResults.push({
                  type: "tool_result",
                  tool_use_id: toolId,
                  content: errMsg,
                  is_error: true,
                });
              }
            } else {
              send({
                type: "tool_result",
                toolId,
                toolName,
                result: "User denied this action.",
                isError: true,
              });
              toolResults.push({
                type: "tool_result",
                tool_use_id: toolId,
                content: "User denied this action.",
                is_error: true,
              });
            }
          }

          workingMessages.push({ role: "user", content: toolResults });
        }

        while (iterations < MAX_ITERATIONS) {
          iterations++;

          const maxTokens = getMaxTokens(model);

          let stream: ReturnType<typeof anthropic.messages.stream>;
          let streamStarted = false;

          for (
            let rateLimitAttempt = 0;
            rateLimitAttempt <= MAX_RATE_LIMIT_RETRIES;
            rateLimitAttempt++
          ) {
            try {
              stream = anthropic.messages.stream({
                model: model as Anthropic.Model,
                max_tokens: maxTokens,
                system,
                messages: workingMessages,
                cache_control: { type: "ephemeral" },
                ...(tools?.length ? { tools } : {}),
              });

              // Force the stream to connect so rate limit errors surface early
              await stream.emitted("connect");
              streamStarted = true;
              break;
            } catch (err) {
              if (
                (isRateLimitError(err) || isOverloadedError(err)) &&
                rateLimitAttempt < MAX_RATE_LIMIT_RETRIES
              ) {
                const retryAfterMs = getRetryAfterMs(err);
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

          if (!streamStarted) {
            send({
              type: "error",
              error: "Rate limit exceeded after maximum retries",
            });
            controller.close();
            return;
          }

          const contentBlocks: Anthropic.ContentBlock[] = [];
          const toolInputBuffers = new Map<number, string>();

          for await (const event of stream!) {
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

              case "content_block_stop": {
                break;
              }

              case "message_start":
              case "message_delta":
              case "message_stop":
                break;
            }
          }

          const finalMessage = await stream.finalMessage();

          totalInputTokens += finalMessage.usage.input_tokens;
          totalOutputTokens += finalMessage.usage.output_tokens;
          const usage = finalMessage.usage as Anthropic.Usage & {
            cache_creation_input_tokens?: number;
            cache_read_input_tokens?: number;
          };
          totalCacheCreationInputTokens += usage.cache_creation_input_tokens ?? 0;
          totalCacheReadInputTokens += usage.cache_read_input_tokens ?? 0;

          for (const block of finalMessage.content) {
            contentBlocks.push(block);
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

          if (finalMessage.stop_reason === "tool_use") {
            const toolUseBlocks: Anthropic.ToolUseBlock[] = [];
            for (const block of finalMessage.content) {
              if (block.type === "tool_use") {
                toolUseBlocks.push(block);
              }
            }

            const readTools = toolUseBlocks.filter((t) => !isWriteTool(t.name));
            const writeTools = toolUseBlocks.filter((t) => isWriteTool(t.name));

            if (writeTools.length > 0) {
              const toolResults: Anthropic.ToolResultBlockParam[] = [];

              for (const toolUse of readTools) {
                const toolName = toolUse.name;
                const toolId = toolUse.id;
                const toolInput = toolUse.input as Record<string, unknown>;

                send({ type: "tool_call", toolName, toolId, input: toolInput });

                const tool = getToolByName(toolName);
                if (!tool) {
                  send({
                    type: "tool_result",
                    toolId,
                    toolName,
                    result: `Error: Tool "${toolName}" not found.`,
                    isError: true,
                  });
                  toolResults.push({
                    type: "tool_result",
                    tool_use_id: toolId,
                    content: `Error: Tool "${toolName}" not found.`,
                    is_error: true,
                  });
                  continue;
                }

                try {
                  const result = await tool.execute(toolInput);
                  const resultStr = JSON.stringify(result);
                  send({
                    type: "tool_result",
                    toolId,
                    toolName,
                    result: resultStr,
                    isError: false,
                  });
                  toolResults.push({
                    type: "tool_result",
                    tool_use_id: toolId,
                    content: resultStr,
                  });
                } catch (err) {
                  const errMsg =
                    err instanceof Error
                      ? err.message
                      : "Tool execution failed";
                  send({
                    type: "tool_result",
                    toolId,
                    toolName,
                    result: errMsg,
                    isError: true,
                  });
                  toolResults.push({
                    type: "tool_result",
                    tool_use_id: toolId,
                    content: errMsg,
                    is_error: true,
                  });
                }
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

              if (onPersist) {
                await onPersist(workingMessages);
              }

              send({
                type: "paused",
                readResults: toolResults,
              });

              controller.close();

              const cacheUsage: CacheUsage = {
                cacheCreationInputTokens: totalCacheCreationInputTokens,
                cacheReadInputTokens: totalCacheReadInputTokens,
              };

              logLlmUsage({
                llmModel: model,
                inputTokens: totalInputTokens,
                outputTokens: totalOutputTokens,
                costUsd: calculateCost(
                  model,
                  totalInputTokens,
                  totalOutputTokens,
                  cacheUsage,
                ),
                systemPrompt: system,
                userPrompt: source,
                source,
              });

              return;
            }

            const toolResults: Anthropic.ToolResultBlockParam[] = [];

            for (const toolUse of toolUseBlocks) {
              const toolName = toolUse.name;
              const toolId = toolUse.id;
              const toolInput = toolUse.input as Record<string, unknown>;

              send({ type: "tool_call", toolName, toolId, input: toolInput });

              const tool = getToolByName(toolName);
              if (!tool) {
                toolResults.push({
                  type: "tool_result",
                  tool_use_id: toolId,
                  content: `Error: Tool "${toolName}" not found.`,
                  is_error: true,
                });
                continue;
              }

              try {
                const result = await tool.execute(toolInput);
                const resultStr = JSON.stringify(result);
                send({
                  type: "tool_result",
                  toolId,
                  toolName,
                  result: resultStr,
                  isError: false,
                });
                toolResults.push({
                  type: "tool_result",
                  tool_use_id: toolId,
                  content: resultStr,
                });
              } catch (err) {
                const errMsg =
                  err instanceof Error ? err.message : "Tool execution failed";
                send({
                  type: "tool_result",
                  toolId,
                  toolName,
                  result: errMsg,
                  isError: true,
                });
                toolResults.push({
                  type: "tool_result",
                  tool_use_id: toolId,
                  content: errMsg,
                  is_error: true,
                });
              }
            }

            workingMessages.push({ role: "user", content: toolResults });
            continue;
          }

          break;
        }

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

        if (onPersist) {
          await onPersist(workingMessages, {
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
            costUsd,
          });
        }

        send({
          type: "done",
          usage: {
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
            cacheCreationInputTokens: totalCacheCreationInputTokens,
            cacheReadInputTokens: totalCacheReadInputTokens,
            costUsd,
            model,
            iterations,
          },
        });

        controller.close();

        logLlmUsage({
          llmModel: model,
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          costUsd,
          systemPrompt: system,
          userPrompt: source,
          source,
        });
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
        } catch {}
      }
    },
  });
}
