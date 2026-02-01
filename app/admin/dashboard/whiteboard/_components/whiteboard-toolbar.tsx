"use client";

import { useState } from "react";
import {
  MousePointer2,
  Hand,
  Pencil,
  Plus,
  Loader2,
  Undo2,
  Menu,
} from "lucide-react";
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
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
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
    undo,
    canUndo,
  } = useWhiteboard();

  const [addPopoverOpen, setAddPopoverOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const handleAddComponent = (templateId: string) => {
    const template = templateRegistry[templateId];
    if (!template || !currentWhiteboard) return;

    const centerX = (-viewState.x + 400) / viewState.zoom;
    const centerY = (-viewState.y + 300) / viewState.zoom;

    addElement({
      type: "component",
      componentType: templateId,
      x: centerX - template.defaultSize.width / 2,
      y: centerY - template.defaultSize.height / 2,
      width: template.defaultSize.width,
      height: template.defaultSize.height,
      data: template.defaultData,
      zIndex: 1,
    });

    setAddPopoverOpen(false);
    setMobileDrawerOpen(false);
    setTool("select");
  };

  return (
    <>
      <div className="hidden sm:flex items-center gap-1 pr-2">
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

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={undo}
              disabled={!currentWhiteboard || !canUndo}
              className="mr-2"
            >
              <Undo2 className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo</TooltipContent>
        </Tooltip>

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
                            : "border-transparent",
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
                            : "hover:bg-muted",
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

      <Drawer open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
        <DrawerTrigger asChild>
          <Button
            variant="outline"
            size="icon-sm"
            className="sm:hidden"
            disabled={!currentWhiteboard}
          >
            <Menu className="size-4" />
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              Tools
              {saving && (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              )}
            </DrawerTitle>
          </DrawerHeader>
          <div className="p-4 space-y-4">
            <div>
              <p className="text-xs font-medium mb-2 text-muted-foreground">
                Mode
              </p>
              <div className="flex gap-1">
                {tools.map((t) => (
                  <Button
                    key={t.id}
                    variant={tool === t.id ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => {
                      setTool(t.id);
                      if (t.id !== "draw") {
                        setMobileDrawerOpen(false);
                      }
                    }}
                    className="flex-1 gap-2"
                  >
                    <t.icon className="size-4" />
                    {t.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  undo();
                  setMobileDrawerOpen(false);
                }}
                disabled={!canUndo}
                className="w-full gap-2"
              >
                <Undo2 className="size-4" />
                Undo
              </Button>
            </div>

            {tool === "draw" && (
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium mb-2 text-muted-foreground">
                    Color
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        className={cn(
                          "size-8 rounded-full border-2 transition-transform active:scale-95",
                          drawSettings.color === color
                            ? "border-ring ring-2 ring-ring ring-offset-2"
                            : "border-transparent",
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          setDrawSettings({ color });
                          setMobileDrawerOpen(false);
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium mb-2 text-muted-foreground">
                    Width
                  </p>
                  <div className="flex gap-2">
                    {widths.map((width) => (
                      <button
                        key={width}
                        className={cn(
                          "size-10 rounded-md border flex items-center justify-center transition-colors",
                          drawSettings.width === width
                            ? "bg-secondary border-ring"
                            : "hover:bg-muted",
                        )}
                        onClick={() => {
                          setDrawSettings({ width });
                          setMobileDrawerOpen(false);
                        }}
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
            )}

            <div>
              <p className="text-xs font-medium mb-2 text-muted-foreground">
                Add Component
              </p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(templateRegistry).map(([id, template]) => (
                  <button
                    key={id}
                    className="flex items-center gap-2 p-3 rounded-md border hover:bg-muted text-left transition-colors"
                    onClick={() => handleAddComponent(id)}
                  >
                    <template.icon className="size-5 text-muted-foreground" />
                    <span className="text-sm">{template.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
