import Anthropic from "@anthropic-ai/sdk";
import { anthropic, calculateCost, getMaxTokens, logLlmUsage } from "@/lib/llm";
import { getToolByName, isWriteTool } from "@/lib/tools/registry";
import type { ToolSchema } from "@/lib/tools/types";

const MAX_ITERATIONS = 15;

interface ConfirmedAction {
  toolId: string;
  toolName: string;
  input: Record<string, unknown>;
}

interface AgenticStreamParams {
  system: string;
  messages: Anthropic.MessageParam[];
  model: string;
  tools?: (ToolSchema | Anthropic.Tool)[];
  source: string;
  confirmedActions?: ConfirmedAction[];
}

export function createAgenticSSEStream({
  system,
  messages,
  model,
  tools,
  source,
  confirmedActions,
}: AgenticStreamParams): ReadableStream {
  const encoder = new TextEncoder();
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
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

        if (confirmedActions?.length) {
          const actionResults: string[] = [];

          for (const action of confirmedActions) {
            const tool = getToolByName(action.toolName);
            if (!tool) {
              actionResults.push(
                `[Action: ${action.toolName} — Error: Tool not found]`,
              );
              continue;
            }

            try {
              const result = await tool.execute(action.input);
              const resultStr = JSON.stringify(result);

              send({
                type: "tool_result",
                toolId: action.toolId,
                toolName: action.toolName,
                result: resultStr,
                isError: false,
              });

              actionResults.push(
                `[Action executed: ${action.toolName}(${JSON.stringify(action.input)}) — Result: ${resultStr}]`,
              );
            } catch (err) {
              const errMsg =
                err instanceof Error ? err.message : "Execution failed";

              send({
                type: "tool_result",
                toolId: action.toolId,
                toolName: action.toolName,
                result: errMsg,
                isError: true,
              });

              actionResults.push(
                `[Action failed: ${action.toolName} — Error: ${errMsg}]`,
              );
            }
          }

          const lastMsg = workingMessages[workingMessages.length - 1];
          if (lastMsg && lastMsg.role === "user") {
            const prefix = actionResults.join("\n");
            if (typeof lastMsg.content === "string") {
              lastMsg.content = prefix + "\n\n" + lastMsg.content;
            } else {
              lastMsg.content = [
                { type: "text" as const, text: prefix },
                ...(lastMsg.content as Anthropic.ContentBlockParam[]),
              ];
            }
          }
        }

        while (iterations < MAX_ITERATIONS) {
          iterations++;

          const maxTokens = getMaxTokens(model);

          const stream = anthropic.messages.stream({
            model: model as Anthropic.Model,
            max_tokens: maxTokens,
            system,
            messages: workingMessages,
            ...(tools?.length ? { tools: tools as Anthropic.Tool[] } : {}),
          });

          stream.on("text", (delta: string) => {
            send({ type: "delta", text: delta });
          });

          const finalMessage = await stream.finalMessage();

          totalInputTokens += finalMessage.usage.input_tokens;
          totalOutputTokens += finalMessage.usage.output_tokens;

          workingMessages.push({
            role: "assistant",
            content: finalMessage.content,
          });

          if (finalMessage.stop_reason === "tool_use") {
            const toolUseBlocks = finalMessage.content.filter(
              (
                block,
              ): block is Anthropic.ContentBlockParam & {
                type: "tool_use";
                id: string;
                name: string;
                input: Record<string, unknown>;
              } => block.type === "tool_use",
            );

            const toolResults: Anthropic.ToolResultBlockParam[] = [];

            for (const toolUse of toolUseBlocks) {
              const toolName = toolUse.name;
              const toolId = toolUse.id;
              const toolInput = toolUse.input as Record<string, unknown>;

              send({
                type: "tool_call",
                toolName,
                toolId,
                input: toolInput,
              });

              if (isWriteTool(toolName)) {
                send({
                  type: "tool_confirmation_required",
                  toolId,
                  toolName,
                  input: toolInput,
                });

                toolResults.push({
                  type: "tool_result",
                  tool_use_id: toolId,
                  content:
                    "This action requires user approval. Please describe what you intend to do and wait for confirmation.",
                });
              } else {
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
            }

            workingMessages.push({
              role: "user",
              content: toolResults,
            });

            const hasWriteTools = toolUseBlocks.some((t) =>
              isWriteTool(t.name),
            );
            if (hasWriteTools) {
              continue;
            }

            continue;
          }

          break;
        }

        const costUsd = calculateCost(
          model,
          totalInputTokens,
          totalOutputTokens,
        );

        send({
          type: "done",
          usage: {
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
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
        try {
          send({ type: "error", error: message });
          controller.close();
        } catch {}
      }
    },
  });
}
