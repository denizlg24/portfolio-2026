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
    [viewState]
  );

  const drawStroke = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      stroke: Stroke,
      offsetX: number,
      offsetY: number,
      zoom: number
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
    []
  );

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
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

    // Draw saved strokes from whiteboard elements
    if (currentWhiteboard) {
      currentWhiteboard.elements
        .filter((el) => el.type === "drawing")
        .forEach((el) => {
          const strokeData = el.data as { points: Point[]; color: string; width: number };
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
              viewState.zoom
            );
          }
        });
    }

    // Draw current stroke
    if (currentStroke) {
      drawStroke(
        ctx,
        currentStroke,
        viewState.x,
        viewState.y,
        viewState.zoom
      );
    }
  }, [currentWhiteboard, currentStroke, viewState, drawStroke]);

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
      }
    },
    [currentWhiteboard, tool, drawSettings, getCanvasPoint]
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
    [isPanning, isDrawing, currentStroke, viewState, setViewState, getCanvasPoint]
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
    [isPanning, isDrawing, currentStroke, addElement]
  );

  // Store viewState in a ref so wheel handler doesn't need to be recreated
  const viewStateRef = useRef(viewState);
  viewStateRef.current = viewState;

  // Non-passive wheel handler for proper scroll prevention
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
