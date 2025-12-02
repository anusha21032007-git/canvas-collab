import { useEffect, useRef, useCallback } from "react";
import { Canvas as FabricCanvas, PencilBrush } from "fabric";

interface CanvasProps {
  brushColor: string;
  brushSize: number;
  isEraser: boolean;
  canvasRef: React.MutableRefObject<FabricCanvas | null>;
}

/**
 * Canvas component for drawing with mouse and touch support
 * Uses Fabric.js for rendering and managing drawing strokes
 */
const Canvas = ({ brushColor, brushSize, isEraser, canvasRef }: CanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const htmlCanvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize the Fabric.js canvas
  useEffect(() => {
    if (!htmlCanvasRef.current || !containerRef.current) return;

    // Get container dimensions for responsive sizing
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Create the Fabric canvas instance
    const canvas = new FabricCanvas(htmlCanvasRef.current, {
      width,
      height,
      backgroundColor: "#ffffff",
      isDrawingMode: true,
    });

    // Initialize free drawing brush
    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.color = brushColor;
    canvas.freeDrawingBrush.width = brushSize;

    // Store reference for parent component access
    canvasRef.current = canvas;

    // Cleanup on unmount
    return () => {
      canvas.dispose();
      canvasRef.current = null;
    };
  }, []);

  // Handle window resize to keep canvas responsive
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current) return;

      const container = containerRef.current;
      const canvas = canvasRef.current;

      // Update canvas dimensions
      canvas.setDimensions({
        width: container.clientWidth,
        height: container.clientHeight,
      });
      canvas.renderAll();
    };

    // Throttle resize events for performance
    let resizeTimeout: NodeJS.Timeout;
    const throttledResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 100);
    };

    window.addEventListener("resize", throttledResize);
    return () => {
      window.removeEventListener("resize", throttledResize);
      clearTimeout(resizeTimeout);
    };
  }, [canvasRef]);

  // Update brush properties when they change
  useEffect(() => {
    if (!canvasRef.current?.freeDrawingBrush) return;

    const brush = canvasRef.current.freeDrawingBrush;

    // For eraser mode, we use white color to simulate erasing
    // In a real app, you might use a composite operation or actual eraser
    if (isEraser) {
      brush.color = "#ffffff";
      brush.width = brushSize * 3; // Larger eraser
    } else {
      brush.color = brushColor;
      brush.width = brushSize;
    }
  }, [brushColor, brushSize, isEraser, canvasRef]);

  return (
    <div
      ref={containerRef}
      className="flex-1 m-4 rounded-lg border border-canvas-border canvas-shadow overflow-hidden bg-canvas"
    >
      <canvas
        ref={htmlCanvasRef}
        className="touch-none cursor-crosshair"
      />
    </div>
  );
};

export default Canvas;
