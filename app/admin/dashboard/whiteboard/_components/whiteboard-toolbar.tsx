"use client";

import { useState } from "react";
import { MousePointer2, Hand, Pencil, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useWhiteboard, Tool } from "./whiteboard-provider";
import { templateRegistry } from "./templates";
import { cn } from "@/lib/utils";

const tools: { id: Tool; icon: typeof MousePointer2; label: string }[] = [
  { id: "select", icon: MousePointer2, label: "Select" },
  { id: "pan", icon: Hand, label: "Pan" },
  { id: "draw", icon: Pencil, label: "Draw" },
];

const colors = [
  "#000000",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

const widths = [1, 2, 3, 5, 8];

export function WhiteboardToolbar() {
  const {
    currentWhiteboard,
    tool,
    setTool,
    drawSettings,
    setDrawSettings,
    addElement,
    saving,
    viewState,
  } = useWhiteboard();

  const [addPopoverOpen, setAddPopoverOpen] = useState(false);

  const handleAddComponent = (templateId: string) => {
    const template = templateRegistry[templateId];
    if (!template || !currentWhiteboard) return;

    const centerX = (-viewState.x + 400) / viewState.zoom;
    const centerY = (-viewState.y + 300) / viewState.zoom;

    addElement({
      type: "component",
      componentType: templateId,
      x: centerX - (template.defaultSize.width / 2),
      y: centerY - (template.defaultSize.height / 2),
      width: template.defaultSize.width,
      height: template.defaultSize.height,
      data: template.defaultData,
      zIndex: 1,
    });

    setAddPopoverOpen(false);
    setTool("select");
  };

  return (
    <div className="flex items-center gap-1 pr-2">
      {saving && (
        <span className="text-xs text-muted-foreground flex items-center gap-1 mr-2">
          <Loader2 className="size-3 animate-spin" />
          Saving
        </span>
      )}

      <div className="flex items-center border rounded-md p-0.5 mr-2">
        {tools.map((t) => (
          <Tooltip key={t.id}>
            <TooltipTrigger asChild>
              <Button
                variant={tool === t.id ? "secondary" : "ghost"}
                size="icon-sm"
                onClick={() => setTool(t.id)}
                disabled={!currentWhiteboard}
              >
                <t.icon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t.label}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      {tool === "draw" && currentWhiteboard && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <div
                className="size-4 rounded-full border"
                style={{ backgroundColor: drawSettings.color }}
              />
              <span className="text-xs">{drawSettings.width}px</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48" align="end">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium mb-2">Color</p>
                <div className="flex flex-wrap gap-1">
                  {colors.map((color) => (
                    <button
                      key={color}
                      className={cn(
                        "size-6 rounded-full border-2 transition-transform hover:scale-110",
                        drawSettings.color === color
                          ? "border-ring"
                          : "border-transparent"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setDrawSettings({ color })}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium mb-2">Width</p>
                <div className="flex gap-1">
                  {widths.map((width) => (
                    <button
                      key={width}
                      className={cn(
                        "size-8 rounded-md border flex items-center justify-center transition-colors",
                        drawSettings.width === width
                          ? "bg-secondary border-ring"
                          : "hover:bg-muted"
                      )}
                      onClick={() => setDrawSettings({ width })}
                    >
                      <div
                        className="rounded-full bg-foreground"
                        style={{ width: width * 2, height: width * 2 }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      <Popover open={addPopoverOpen} onOpenChange={setAddPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={!currentWhiteboard}
            className="gap-1"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">Add</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48" align="end">
          <p className="text-xs font-medium mb-2">Components</p>
          <div className="space-y-1">
            {Object.entries(templateRegistry).map(([id, template]) => (
              <button
                key={id}
                className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-muted text-left transition-colors"
                onClick={() => handleAddComponent(id)}
              >
                <template.icon className="size-4 text-muted-foreground" />
                <span className="text-sm">{template.name}</span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
