import { CheckSquare, LucideIcon } from "lucide-react";
import { TodoListTemplate } from "./todo-list";
import { ComponentType } from "react";

interface TemplateDefinition {
  name: string;
  icon: LucideIcon;
  defaultSize: { width: number; height: number };
  defaultData: Record<string, unknown>;
  component: ComponentType<TemplateProps>;
}

export interface TemplateProps {
  id: string;
  data: Record<string, unknown>;
  onDataChange: (data: Record<string, unknown>) => void;
  onDelete: () => void;
}

export const templateRegistry: Record<string, TemplateDefinition> = {
  "todo-list": {
    name: "Todo List",
    icon: CheckSquare,
    defaultSize: { width: 280, height: 320 },
    defaultData: {
      title: "Todo List",
      items: [] as { id: string; text: string; completed: boolean }[],
    },
    component: TodoListTemplate,
  },
};
