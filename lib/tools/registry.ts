import type { ToolDefinition, ToolSchema } from "./types";
import { calendarTools } from "./calendar";
import { kanbanTools } from "./kanban";
import { notesTools } from "./notes";
import { timetableTools } from "./timetable";
import { contactsTools } from "./contacts";
import { blogTools } from "./blog";
import { projectsTools } from "./projects";
import { timelineTools } from "./timeline";
import { emailTools } from "./email";

const allTools: ToolDefinition[] = [
  ...calendarTools,
  ...kanbanTools,
  ...notesTools,
  ...timetableTools,
  ...contactsTools,
  ...blogTools,
  ...projectsTools,
  ...timelineTools,
  ...emailTools,
];

const toolMap = new Map<string, ToolDefinition>();
for (const tool of allTools) {
  toolMap.set(tool.schema.name, tool);
}

export function getToolSchemas(): ToolSchema[] {
  return allTools.map((t) => t.schema);
}

export function getReadOnlyToolSchemas(): ToolSchema[] {
  return allTools.filter((t) => !t.isWrite).map((t) => t.schema);
}

export function getToolByName(name: string): ToolDefinition | undefined {
  return toolMap.get(name);
}

export function isWriteTool(name: string): boolean {
  return toolMap.get(name)?.isWrite ?? false;
}
