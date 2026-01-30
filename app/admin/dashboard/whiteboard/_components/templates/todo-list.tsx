"use client";

import { useState } from "react";
import { Trash2, GripVertical, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
} from "@/components/ui/sortable";
import { cn } from "@/lib/utils";
import type { TemplateProps } from "./index";

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export function TodoListTemplate({
  id,
  data,
  onDataChange,
  onDelete,
}: TemplateProps) {
  const [newItemText, setNewItemText] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const title = (data.title as string) || "Todo List";
  const items = (data.items as TodoItem[]) || [];

  const updateItems = (newItems: TodoItem[]) => {
    onDataChange({ ...data, items: newItems });
  };

  const addItem = () => {
    if (!newItemText.trim()) return;
    const newItem: TodoItem = {
      id: crypto.randomUUID(),
      text: newItemText.trim(),
      completed: false,
    };
    updateItems([...items, newItem]);
    setNewItemText("");
  };

  const toggleItem = (itemId: string) => {
    updateItems(
      items.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const deleteItem = (itemId: string) => {
    updateItems(items.filter((item) => item.id !== itemId));
  };

  const updateTitle = (newTitle: string) => {
    onDataChange({ ...data, title: newTitle });
    setIsEditingTitle(false);
  };

  return (
    <div className="bg-background border rounded-lg shadow-md overflow-hidden h-full flex flex-col">
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        {isEditingTitle ? (
          <Input
            className="h-7 text-sm font-medium"
            defaultValue={title}
            autoFocus
            onBlur={(e) => updateTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateTitle(e.currentTarget.value);
              }
              if (e.key === "Escape") {
                setIsEditingTitle(false);
              }
            }}
          />
        ) : (
          <h3
            className="text-sm font-medium cursor-pointer hover:text-primary"
            onClick={() => setIsEditingTitle(true)}
          >
            {title}
          </h3>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-6 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
        >
          <X className="size-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2" onMouseDown={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
        <Sortable
          value={items}
          onValueChange={updateItems}
          getItemValue={(item) => item.id}
        >
          <SortableContent className="space-y-1">
            {items.map((item) => (
              <SortableItem
                key={item.id}
                value={item.id}
                className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 group"
              >
                <SortableItemHandle asChild>
                  <button className="hidden group-hover:block touch-none">
                    <GripVertical className="size-3.5 text-muted-foreground" />
                  </button>
                </SortableItemHandle>
                <Checkbox
                className="border-border"
                  checked={item.completed}
                  onCheckedChange={() => toggleItem(item.id)}
                />
                <span
                  className={cn(
                    "flex-1 text-sm",
                    item.completed && "line-through text-muted-foreground"
                  )}
                >
                  {item.text}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="size-6 opacity-0 group-hover:opacity-100"
                  onClick={() => deleteItem(item.id)}
                >
                  <Trash2 className="size-3 text-muted-foreground hover:text-destructive" />
                </Button>
              </SortableItem>
            ))}
          </SortableContent>
          <SortableOverlay>
            {({ value }) => {
              const item = items.find((i) => i.id === value);
              if (!item) return null;
              return (
                <div className="flex items-center gap-2 p-1.5 rounded bg-background border shadow-lg">
                  <GripVertical className="size-3.5 text-muted-foreground" />
                  <Checkbox checked={item.completed} disabled />
                  <span
                    className={cn(
                      "flex-1 text-sm",
                      item.completed && "line-through text-muted-foreground"
                    )}
                  >
                    {item.text}
                  </span>
                </div>
              );
            }}
          </SortableOverlay>
        </Sortable>

        {items.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            No items yet
          </p>
        )}
      </div>

      <div className="p-2 border-t" onMouseDown={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
        <div className="flex gap-1">
          <Input
            placeholder="Add item..."
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            className="h-8 text-sm"
          />
          <Button
            size="icon-sm"
            variant="outline"
            onClick={addItem}
            disabled={!newItemText.trim()}
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
