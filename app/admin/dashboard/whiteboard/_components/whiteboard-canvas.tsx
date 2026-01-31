"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useWhiteboard } from "./whiteboard-provider";

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

export function WhiteboardCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    currentWhiteboard,
    tool,
    drawSettings,
    viewState,
    setViewState,
    addElement,
    selectedElementId,
    setSelectedElementId,
    removeElement,
    undo,
    canUndo,
  } = useWhiteboard();

  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const lastPanPoint = useRef<Point | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const getCanvasPoint = useCallback(
    (clientX: number, clientY: number): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      return {
        x: (clientX - rect.left - viewState.x) / viewState.zoom,
        y: (clientY - rect.top - viewState.y) / viewState.zoom,
      };
    },
    [viewState],
  );

  const drawStroke = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      stroke: Stroke,
      offsetX: number,
      offsetY: number,
      zoom: number,
    ) => {
      if (stroke.points.length < 2) return;

      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width * zoom;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const firstPoint = stroke.points[0];
      ctx.moveTo(firstPoint.x * zoom + offsetX, firstPoint.y * zoom + offsetY);

      for (let i = 1; i < stroke.points.length; i++) {
        const point = stroke.points[i];
        ctx.lineTo(point.x * zoom + offsetX, point.y * zoom + offsetY);
      }

      ctx.stroke();
    },
    [],
  );

  const getStrokeBounds = useCallback((points: Point[]) => {
    if (points.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    let minX = points[0].x,
      minY = points[0].y;
    let maxX = points[0].x,
      maxY = points[0].y;
    for (const p of points) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    return { minX, minY, maxX, maxY };
  }, []);

  const isPointNearStroke = useCallback(
    (point: Point, strokePoints: Point[], threshold: number) => {
      for (let i = 0; i < strokePoints.length - 1; i++) {
        const a = strokePoints[i];
        const b = strokePoints[i + 1];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len === 0) continue;
        const t = Math.max(
          0,
          Math.min(
            1,
            ((point.x - a.x) * dx + (point.y - a.y) * dy) / (len * len),
          ),
        );
        const nearestX = a.x + t * dx;
        const nearestY = a.y + t * dy;
        const dist = Math.sqrt(
          (point.x - nearestX) ** 2 + (point.y - nearestY) ** 2,
        );
        if (dist <= threshold) return true;
      }
      return false;
    },
    [],
  );

  const drawSelectionBox = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      points: Point[],
      offsetX: number,
      offsetY: number,
      zoom: number,
    ) => {
      const bounds = getStrokeBounds(points);
      const padding = 8;
      ctx.save();
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        bounds.minX * zoom + offsetX - padding,
        bounds.minY * zoom + offsetY - padding,
        (bounds.maxX - bounds.minX) * zoom + padding * 2,
        (bounds.maxY - bounds.minY) * zoom + padding * 2,
      );
      ctx.restore();
    },
    [getStrokeBounds],
  );

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;

    const gridSize = 40 * viewState.zoom;
    const offsetX = viewState.x % gridSize;
    const offsetY = viewState.y % gridSize;

    for (let x = offsetX; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    for (let y = offsetY; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    ctx.restore();

    if (currentWhiteboard) {
      currentWhiteboard.elements
        .filter((el) => el.type === "drawing")
        .forEach((el) => {
          const strokeData = el.data as {
            points: Point[];
            color: string;
            width: number;
          };
          if (strokeData.points) {
            drawStroke(
              ctx,
              {
                points: strokeData.points,
                color: strokeData.color || "#000000",
                width: strokeData.width || 3,
              },
              viewState.x,
              viewState.y,
              viewState.zoom,
            );

            if (el.id === selectedElementId) {
              drawSelectionBox(
                ctx,
                strokeData.points,
                viewState.x,
                viewState.y,
                viewState.zoom,
              );
            }
          }
        });
    }

    if (currentStroke) {
      drawStroke(ctx, currentStroke, viewState.x, viewState.y, viewState.zoom);
    }
  }, [
    currentWhiteboard,
    currentStroke,
    viewState,
    drawStroke,
    selectedElementId,
    drawSelectionBox,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
      render();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [render]);

  useEffect(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [render]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!currentWhiteboard) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.setPointerCapture(e.pointerId);

      if (tool === "pan" || (tool === "select" && e.button === 1)) {
        setIsPanning(true);
        lastPanPoint.current = { x: e.clientX, y: e.clientY };
      } else if (tool === "draw") {
        setIsDrawing(true);
        const point = getCanvasPoint(e.clientX, e.clientY);
        setCurrentStroke({
          points: [point],
          color: drawSettings.color,
          width: drawSettings.width,
        });
      } else if (tool === "select" && e.button === 0) {
        const point = getCanvasPoint(e.clientX, e.clientY);
        const drawings = currentWhiteboard.elements.filter(
          (el) => el.type === "drawing",
        );

        let foundId: string | null = null;
        for (let i = drawings.length - 1; i >= 0; i--) {
          const el = drawings[i];
          const strokeData = el.data as { points: Point[]; width: number };
          if (
            strokeData.points &&
            isPointNearStroke(
              point,
              strokeData.points,
              (strokeData.width || 3) + 5,
            )
          ) {
            foundId = el.id;
            break;
          }
        }
        setSelectedElementId(foundId);
      }
    },
    [
      currentWhiteboard,
      tool,
      drawSettings,
      getCanvasPoint,
      isPointNearStroke,
      setSelectedElementId,
    ],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (isPanning && lastPanPoint.current) {
        const dx = e.clientX - lastPanPoint.current.x;
        const dy = e.clientY - lastPanPoint.current.y;
        setViewState({
          ...viewState,
          x: viewState.x + dx,
          y: viewState.y + dy,
        });
        lastPanPoint.current = { x: e.clientX, y: e.clientY };
      } else if (isDrawing && currentStroke) {
        const point = getCanvasPoint(e.clientX, e.clientY);
        setCurrentStroke({
          ...currentStroke,
          points: [...currentStroke.points, point],
        });
      }
    },
    [
      isPanning,
      isDrawing,
      currentStroke,
      viewState,
      setViewState,
      getCanvasPoint,
    ],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.releasePointerCapture(e.pointerId);
      }

      if (isPanning) {
        setIsPanning(false);
        lastPanPoint.current = null;
      }

      if (isDrawing && currentStroke && currentStroke.points.length > 1) {
        addElement({
          type: "drawing",
          x: 0,
          y: 0,
          data: {
            points: currentStroke.points,
            color: currentStroke.color,
            width: currentStroke.width,
          },
          zIndex: 0,
        });
        setCurrentStroke(null);
      }
      setIsDrawing(false);
    },
    [isPanning, isDrawing, currentStroke, addElement],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")
      ) {
        return;
      }

      if ((e.key === "Delete" || e.key === "Backspace") && selectedElementId) {
        e.preventDefault();
        removeElement(selectedElementId);
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "z" && canUndo) {
        e.preventDefault();
        undo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedElementId, removeElement, undo, canUndo]);

  const viewStateRef = useRef(viewState);
  viewStateRef.current = viewState;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentWhiteboard) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const vs = viewStateRef.current;
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.min(Math.max(vs.zoom * zoomFactor, 0.1), 5);

      const newX = mouseX - (mouseX - vs.x) * (newZoom / vs.zoom);
      const newY = mouseY - (mouseY - vs.y) * (newZoom / vs.zoom);

      setViewState({
        x: newX,
        y: newY,
        zoom: newZoom,
      });
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [currentWhiteboard, setViewState]);

  const getCursor = () => {
    if (tool === "pan" || isPanning) return "grab";
    if (tool === "draw") return "crosshair";
    return "default";
  };

  if (!currentWhiteboard) {
    return (
      <div
        ref={containerRef}
        className="absolute inset-0 flex items-center justify-center text-muted-foreground"
      >
        Select or create a whiteboard to get started
      </div>
    );
  }

  return (
    <div ref={containerRef} className="absolute inset-0">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 touch-none"
        style={{ cursor: getCursor() }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
    </div>
  );
}
