"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { useWhiteboard } from "./whiteboard-provider";
import { templateRegistry } from "./templates";
import { IWhiteboardElement } from "@/models/Whiteboard";

interface DragState {
  elementId: string;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

export function ComponentsLayer() {
  const {
    currentWhiteboard,
    viewState,
    updateElement,
    removeElement,
    tool,
  } = useWhiteboard();

  const containerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);

  const componentElements =
    currentWhiteboard?.elements.filter((el) => el.type === "component") || [];

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, element: IWhiteboardElement) => {
      if (tool !== "select") return;

      // Don't start drag if clicking on interactive elements
      const target = e.target as HTMLElement;
      const isInteractive = target.closest('input, button, textarea, [data-no-drag], [role="checkbox"]');
      if (isInteractive) return;

      e.preventDefault();
      e.stopPropagation();

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      setDragState({
        elementId: element.id,
        startX: element.x,
        startY: element.y,
        offsetX: e.clientX - rect.left - element.x * viewState.zoom - viewState.x,
        offsetY: e.clientY - rect.top - element.y * viewState.zoom - viewState.y,
      });
    },
    [tool, viewState]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const newX =
        (e.clientX - rect.left - dragState.offsetX - viewState.x) /
        viewState.zoom;
      const newY =
        (e.clientY - rect.top - dragState.offsetY - viewState.y) /
        viewState.zoom;

      updateElement(dragState.elementId, { x: newX, y: newY });
    },
    [dragState, viewState, updateElement]
  );

  const handleMouseUp = useCallback(() => {
    setDragState(null);
  }, []);

  useEffect(() => {
    if (dragState) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragState, handleMouseMove, handleMouseUp]);

  const handleDataChange = useCallback(
    (elementId: string, newData: Record<string, unknown>) => {
      updateElement(elementId, { data: newData });
    },
    [updateElement]
  );

  const handleDelete = useCallback(
    (elementId: string) => {
      removeElement(elementId);
    },
    [removeElement]
  );

  if (!currentWhiteboard) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden"
    >
      {componentElements.map((element) => {
        const template = element.componentType
          ? templateRegistry[element.componentType]
          : null;

        if (!template) return null;

        const Component = template.component;

        const style: React.CSSProperties = {
          position: "absolute",
          left: element.x * viewState.zoom + viewState.x,
          top: element.y * viewState.zoom + viewState.y,
          width: (element.width || template.defaultSize.width) * viewState.zoom,
          height:
            (element.height || template.defaultSize.height) * viewState.zoom,
          transform: `scale(${viewState.zoom})`,
          transformOrigin: "top left",
          pointerEvents: tool === "select" ? "auto" : "none",
          cursor: dragState?.elementId === element.id ? "grabbing" : "grab",
        };

        return (
          <div
            key={element.id}
            style={style}
            onMouseDown={(e) => handleMouseDown(e, element)}
          >
            <div
              style={{
                width: element.width || template.defaultSize.width,
                height: element.height || template.defaultSize.height,
              }}
            >
              <Component
                id={element.id}
                data={element.data}
                onDataChange={(data) => handleDataChange(element.id, data)}
                onDelete={() => handleDelete(element.id)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
