import type { ToolDefinition } from "./types";
import {
  getAllBoards,
  getFullBoard,
  createCard,
  updateCard,
} from "@/lib/kanban";

export const kanbanTools: ToolDefinition[] = [
  {
    schema: {
      name: "list_kanban_boards",
      description:
        "List all active kanban boards. Returns board titles, descriptions, and IDs.",
      input_schema: {
        type: "object",
        properties: {},
      },
    },
    isWrite: false,
    category: "kanban",
    execute: async () => {
      return await getAllBoards();
    },
  },
  {
    schema: {
      name: "get_kanban_board",
      description:
        "Get a kanban board with all its columns and cards. Use this to see the full board state.",
      input_schema: {
        type: "object",
        properties: {
          boardId: { type: "string", description: "Board ID" },
        },
        required: ["boardId"],
      },
    },
    isWrite: false,
    category: "kanban",
    execute: async (input) => {
      const board = await getFullBoard(input.boardId as string);
      if (!board) throw new Error("Board not found");
      return board;
    },
  },
  {
    schema: {
      name: "create_kanban_card",
      description: "Create a new card on a kanban board in a specific column.",
      input_schema: {
        type: "object",
        properties: {
          boardId: { type: "string", description: "Board ID" },
          columnId: { type: "string", description: "Column ID to place the card in" },
          title: { type: "string", description: "Card title" },
          description: { type: "string", description: "Card description (optional)" },
          priority: {
            type: "string",
            description: "Card priority (optional)",
            enum: ["none", "low", "medium", "high", "urgent"],
          },
          dueDate: { type: "string", description: "Due date in ISO 8601 (optional)" },
          labels: {
            type: "array",
            description: "Labels/tags for the card (optional)",
            items: { type: "string" },
          },
        },
        required: ["boardId", "columnId", "title"],
      },
    },
    isWrite: true,
    category: "kanban",
    execute: async (input) => {
      return await createCard(
        input.boardId as string,
        input.columnId as string,
        {
          title: input.title as string,
          description: input.description as string | undefined,
          priority: input.priority as string | undefined,
          dueDate: input.dueDate as string | undefined,
          labels: input.labels as string[] | undefined,
        },
      );
    },
  },
  {
    schema: {
      name: "update_kanban_card",
      description: "Update an existing kanban card. Can change title, description, column, priority, etc.",
      input_schema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Card ID" },
          title: { type: "string", description: "New title (optional)" },
          description: { type: "string", description: "New description (optional)" },
          columnId: { type: "string", description: "Move to this column (optional)" },
          priority: {
            type: "string",
            description: "New priority (optional)",
            enum: ["none", "low", "medium", "high", "urgent"],
          },
          dueDate: { type: "string", description: "New due date in ISO 8601, or null to clear (optional)" },
          isArchived: { type: "boolean", description: "Archive or unarchive the card (optional)" },
        },
        required: ["id"],
      },
    },
    isWrite: true,
    category: "kanban",
    execute: async (input) => {
      const data: Record<string, unknown> = {};
      if (input.title !== undefined) data.title = input.title;
      if (input.description !== undefined) data.description = input.description;
      if (input.columnId !== undefined) data.columnId = input.columnId;
      if (input.priority !== undefined) data.priority = input.priority;
      if (input.dueDate !== undefined) data.dueDate = input.dueDate;
      if (input.isArchived !== undefined) data.isArchived = input.isArchived;
      const result = await updateCard(input.id as string, data);
      if (!result) throw new Error("Card not found");
      return result;
    },
  },
];
