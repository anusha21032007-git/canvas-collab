import { useEffect, useRef } from "react";
import {
  Canvas as FabricCanvas,
  PencilBrush,
  Rect,
  Circle,
  Line,
  IEvent,
  Object as FabricObject,
  IText,
  Group,
} from "fabric";

interface CanvasProps {
  brushColor: string;
  brushSize: number;
  activeTool: string;
  canvasRef: React.MutableRefObject<FabricCanvas | null>;
  onUpdate: () => void;
}

const Canvas = ({
  brushColor,
  brushSize,
  activeTool,
  canvasRef,
  onUpdate,
}: CanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const htmlCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingState = useRef<{
    shape: FabricObject | null;
    startPoint: { x: number; y: number } | null;
  }>({ shape: null, startPoint: null }).current;

  // Initialize the Fabric.js canvas
  useEffect(() => {
    if (!htmlCanvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const canvas = new FabricCanvas(htmlCanvasRef.current, {
      width: container.clientWidth,
      height: container.clientHeight,
      backgroundColor: "#ffffff",
      isDrawingMode: true,
    });

    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.color = brushColor;
    canvas.freeDrawingBrush.width = brushSize;

    canvasRef.current = canvas;

    return () => {
      canvas.dispose();
      canvasRef.current = null;
    };
  }, [brushColor, brushSize, canvasRef]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current) return;
      const container = containerRef.current;
      canvasRef.current.setDimensions({
        width: container.clientWidth,
        height: container.clientHeight,
      });
      canvasRef.current.renderAll();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [canvasRef]);

  // Update brush properties
  useEffect(() => {
    if (!canvasRef.current?.freeDrawingBrush) return;
    const brush = canvasRef.current.freeDrawingBrush;
    if (activeTool === "eraser") {
      brush.color = "#ffffff";
      brush.width = brushSize * 3;
    } else {
      brush.color = brushColor;
      brush.width = brushSize;
    }
  }, [brushColor, brushSize, activeTool, canvasRef]);

  // Handle tool switching and event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isDrawingTool = activeTool === "pencil" || activeTool === "eraser";
    const isShapeTool =
      activeTool === "rectangle" || activeTool === "circle" || activeTool === "line";
    const isTextTool = activeTool === "text";
    const isStickyNoteTool = activeTool === "sticky-note";

    canvas.isDrawingMode = isDrawingTool;
    canvas.selection = !isTextTool && !isStickyNoteTool;
    canvas.defaultCursor = isTextTool ? "text" : "crosshair";

    const handleMouseDown = (e: IEvent) => {
      if (!e.pointer) return;
      const { x, y } = e.pointer;

      if (isStickyNoteTool) {
        const noteBg = new Rect({
          width: 200,
          height: 200,
          fill: "#FFD54F", // A nice yellow for sticky notes
          shadow: "rgba(0,0,0,0.2) 3px 3px 7px",
          rx: 8,
          ry: 8,
        });

        const noteText = new IText("Type here...", {
          top: 15,
          left: 15,
          width: 170,
          fontSize: 22,
          fontFamily: "Inter, sans-serif",
          fill: "#333",
        });

        const group = new Group([noteBg, noteText], {
          left: x - 100,
          top: y - 100,
        });

        canvas.add(group);
        canvas.setActiveObject(group);
        onUpdate();
        canvas.renderAll();
        return;
      }

      if (isTextTool) {
        const text = new IText("Type here", {
          left: x,
          top: y,
          fill: brushColor,
          fontSize: brushSize * 4,
          fontFamily: "Inter, sans-serif",
          editable: true,
        });

        text.on("editing:entered", () => {
          if (text.text === "Type here") {
            text.selectAll();
            canvas.renderAll();
          }
        });

        canvas.add(text);
        canvas.setActiveObject(text);
        text.enterEditing();
        onUpdate();
        canvas.renderAll();
        return;
      }

      if (isShapeTool) {
        drawingState.startPoint = { x, y };
        let shape: FabricObject | null = null;

        const commonProps = {
          left: x,
          top: y,
          fill: "transparent",
          stroke: brushColor,
          strokeWidth: brushSize,
          originX: "left",
          originY: "top",
        };

        switch (activeTool) {
          case "rectangle":
            shape = new Rect({ ...commonProps, width: 0, height: 0 });
            break;
          case "circle":
            shape = new Circle({ ...commonProps, radius: 0 });
            break;
          case "line":
            shape = new Line([x, y, x, y], {
              stroke: brushColor,
              strokeWidth: brushSize,
            });
            break;
        }
        if (shape) {
          drawingState.shape = shape;
          canvas.add(shape);
        }
      }
    };

    const handleMouseMove = (e: IEvent) => {
      if (!drawingState.shape || !drawingState.startPoint || !e.pointer) return;
      const { x: startX, y: startY } = drawingState.startPoint;
      const { x: currentX, y: currentY } = e.pointer;

      switch (activeTool) {
        case "rectangle":
          drawingState.shape.set({
            left: Math.min(startX, currentX),
            top: Math.min(startY, currentY),
            width: Math.abs(startX - currentX),
            height: Math.abs(startY - currentY),
          });
          break;
        case "circle":
          const radius = Math.sqrt(Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2)) / 2;
          (drawingState.shape as Circle).set({
            left: (startX + currentX) / 2,
            top: (startY + currentY) / 2,
            originX: "center",
            originY: "center",
            radius,
          });
          break;
        case "line":
          (drawingState.shape as Line).set({ x2: currentX, y2: currentY });
          break;
      }
      canvas.renderAll();
    };

    const handleMouseUp = () => {
      if (drawingState.shape) {
        drawingState.shape.setCoords();
        onUpdate();
      }
      drawingState.shape = null;
      drawingState.startPoint = null;
    };

    const handlePathCreated = () => onUpdate();

    canvas.off("mouse:down");
    canvas.off("mouse:move");
    canvas.off("mouse:up");
    canvas.off("path:created");

    if (isDrawingTool) {
      canvas.on("path:created", handlePathCreated);
    } else {
      canvas.on("mouse:down", handleMouseDown);
      if (isShapeTool) {
        canvas.on("mouse:move", handleMouseMove);
        canvas.on("mouse:up", handleMouseUp);
      }
    }

    return () => {
      if (canvas) {
        canvas.off("mouse:down");
        canvas.off("mouse:move");
        canvas.off("mouse:up");
        canvas.off("path:created");
      }
    };
  }, [activeTool, brushColor, brushSize, canvasRef, onUpdate, drawingState]);

  return (
    <div
      ref={containerRef}
      className="flex-1 m-4 rounded-lg border border-canvas-border canvas-shadow overflow-hidden bg-canvas"
    >
      <canvas ref={htmlCanvasRef} />
    </div>
  );
};

export default Canvas;