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
  const { currentWhiteboard, viewState, updateElement, removeElement, tool } =
    useWhiteboard();

  const containerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);

  const componentElements =
    currentWhiteboard?.elements.filter((el) => el.type === "component") || [];

  const startDrag = useCallback(
    (
      clientX: number,
      clientY: number,
      element: IWhiteboardElement,
      target: HTMLElement,
    ) => {
      if (tool !== "select") return false;

      // Don't start drag if clicking on interactive elements
      const isInteractive = target.closest(
        'input, button, textarea, [data-no-drag], [role="checkbox"]',
      );
      if (isInteractive) return false;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return false;

      setDragState({
        elementId: element.id,
        startX: element.x,
        startY: element.y,
        offsetX: clientX - rect.left - element.x * viewState.zoom - viewState.x,
        offsetY: clientY - rect.top - element.y * viewState.zoom - viewState.y,
      });
      return true;
    },
    [tool, viewState],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, element: IWhiteboardElement) => {
      if (startDrag(e.clientX, e.clientY, element, e.target as HTMLElement)) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [startDrag],
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent, element: IWhiteboardElement) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        if (
          startDrag(
            touch.clientX,
            touch.clientY,
            element,
            e.target as HTMLElement,
          )
        ) {
          e.stopPropagation();
        }
      }
    },
    [startDrag],
  );

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!dragState) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const newX =
        (clientX - rect.left - dragState.offsetX - viewState.x) /
        viewState.zoom;
      const newY =
        (clientY - rect.top - dragState.offsetY - viewState.y) / viewState.zoom;

      updateElement(dragState.elementId, { x: newX, y: newY });
    },
    [dragState, viewState, updateElement],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => handleMove(e.clientX, e.clientY),
    [handleMove],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 1) {
        e.preventDefault();
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    },
    [handleMove],
  );

  const handleEnd = useCallback(() => {
    setDragState(null);
  }, []);

  useEffect(() => {
    if (dragState) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleEnd);
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", handleEnd);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleEnd);
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleEnd);
      };
    }
  }, [dragState, handleMouseMove, handleTouchMove, handleEnd]);

  const handleDataChange = useCallback(
    (elementId: string, newData: Record<string, unknown>) => {
      updateElement(elementId, { data: newData });
    },
    [updateElement],
  );

  const handleDelete = useCallback(
    (elementId: string) => {
      removeElement(elementId);
    },
    [removeElement],
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
            onTouchStart={(e) => handleTouchStart(e, element)}
          >
            <Component
              id={element.id}
              data={element.data}
              width={element.width || template.defaultSize.width}
              height={element.height || template.defaultSize.height}
              onDataChange={(data) => handleDataChange(element.id, data)}
              onDelete={() => handleDelete(element.id)}
            />
          </div>
        );
      })}
    </div>
  );
}
