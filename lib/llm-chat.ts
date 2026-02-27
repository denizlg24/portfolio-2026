import Anthropic from "@anthropic-ai/sdk";
import { anthropic, calculateCost, getMaxTokens, logLlmUsage } from "@/lib/llm";
import { getToolByName, isWriteTool } from "@/lib/tools/registry";
import type { ToolSchema } from "@/lib/tools/types";

const MAX_ITERATIONS = 15;

interface AgenticStreamParams {
  system: string;
  messages: Anthropic.MessageParam[];
  model: string;
  tools?: (ToolSchema | Anthropic.Tool)[];
  source: string;
  toolApprovals?: Record<string, boolean>;
  onPersist?: (
    messages: Anthropic.MessageParam[],
    tokenUsage?: { inputTokens: number; outputTokens: number; costUsd: number },
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
          if (lastAssistant?.role !== "assistant" || !Array.isArray(lastAssistant.content)) {
            send({ type: "error", error: "Invalid state for tool continuation" });
            controller.close();
            return;
          }

          const toolUseBlocks = (lastAssistant.content as Anthropic.ContentBlock[]).filter(
            (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
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
                send({ type: "tool_result", toolId, toolName, result: resultStr, isError: false });
                toolResults.push({ type: "tool_result", tool_use_id: toolId, content: resultStr });
              } catch (err) {
                const errMsg = err instanceof Error ? err.message : "Tool execution failed";
                send({ type: "tool_result", toolId, toolName, result: errMsg, isError: true });
                toolResults.push({ type: "tool_result", tool_use_id: toolId, content: errMsg, is_error: true });
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
                send({ type: "tool_result", toolId, toolName, result: resultStr, isError: false });
                toolResults.push({ type: "tool_result", tool_use_id: toolId, content: resultStr });
              } catch (err) {
                const errMsg = err instanceof Error ? err.message : "Execution failed";
                send({ type: "tool_result", toolId, toolName, result: errMsg, isError: true });
                toolResults.push({ type: "tool_result", tool_use_id: toolId, content: errMsg, is_error: true });
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
              (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
            );

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
                  send({ type: "tool_result", toolId, toolName, result: `Error: Tool "${toolName}" not found.`, isError: true });
                  toolResults.push({ type: "tool_result", tool_use_id: toolId, content: `Error: Tool "${toolName}" not found.`, is_error: true });
                  continue;
                }

                try {
                  const result = await tool.execute(toolInput);
                  const resultStr = JSON.stringify(result);
                  send({ type: "tool_result", toolId, toolName, result: resultStr, isError: false });
                  toolResults.push({ type: "tool_result", tool_use_id: toolId, content: resultStr });
                } catch (err) {
                  const errMsg = err instanceof Error ? err.message : "Tool execution failed";
                  send({ type: "tool_result", toolId, toolName, result: errMsg, isError: true });
                  toolResults.push({ type: "tool_result", tool_use_id: toolId, content: errMsg, is_error: true });
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

              logLlmUsage({
                llmModel: model,
                inputTokens: totalInputTokens,
                outputTokens: totalOutputTokens,
                costUsd: calculateCost(model, totalInputTokens, totalOutputTokens),
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
                send({ type: "tool_result", toolId, toolName, result: resultStr, isError: false });
                toolResults.push({ type: "tool_result", tool_use_id: toolId, content: resultStr });
              } catch (err) {
                const errMsg = err instanceof Error ? err.message : "Tool execution failed";
                send({ type: "tool_result", toolId, toolName, result: errMsg, isError: true });
                toolResults.push({ type: "tool_result", tool_use_id: toolId, content: errMsg, is_error: true });
              }
            }

            workingMessages.push({ role: "user", content: toolResults });
            continue;
          }

          break;
        }

        const costUsd = calculateCost(model, totalInputTokens, totalOutputTokens);

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
