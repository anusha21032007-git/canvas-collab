import { useState, useRef, useCallback } from "react";
import { Canvas as FabricCanvas } from "fabric";
import { toast } from "sonner";
import Header from "./Header";
import Toolbar from "./Toolbar";
import Canvas from "./Canvas";

/**
 * Main Whiteboard component that orchestrates all whiteboard functionality
 * Manages state for drawing tools and coordinates between components
 */
const Whiteboard = () => {
  // Drawing state
  const [brushColor, setBrushColor] = useState("hsl(0, 0%, 10%)");
  const [brushSize, setBrushSize] = useState(6);
  const [isEraser, setIsEraser] = useState(false);

  // Mock user count (would come from Socket.io in real implementation)
  const [userCount] = useState(3);

  // Undo history tracking
  const [canUndo, setCanUndo] = useState(false);

  // Reference to the Fabric.js canvas instance
  const canvasRef = useRef<FabricCanvas | null>(null);

  // Handle color selection
  const handleColorChange = useCallback((color: string) => {
    setBrushColor(color);
    setIsEraser(false); // Switch back to draw mode when selecting color
  }, []);

  // Handle brush size change
  const handleSizeChange = useCallback((size: number) => {
    setBrushSize(size);
  }, []);

  // Toggle eraser mode
  const handleEraserToggle = useCallback(() => {
    setIsEraser((prev) => !prev);
  }, []);

  // Clear all drawings from the canvas
  const handleClearAll = useCallback(() => {
    if (!canvasRef.current) return;

    canvasRef.current.clear();
    canvasRef.current.backgroundColor = "#ffffff";
    canvasRef.current.renderAll();
    setCanUndo(false);
    toast.success("Canvas cleared!");
  }, []);

  // Undo the last drawing action
  const handleUndo = useCallback(() => {
    if (!canvasRef.current) return;

    const objects = canvasRef.current.getObjects();
    if (objects.length > 0) {
      const lastObject = objects[objects.length - 1];
      canvasRef.current.remove(lastObject);
      canvasRef.current.renderAll();

      if (objects.length <= 1) {
        setCanUndo(false);
      }
      toast("Undo successful");
    }
  }, []);

  // Download canvas as PNG image
  const handleDownload = useCallback(() => {
    if (!canvasRef.current) return;

    // Get canvas data as PNG
    const dataURL = canvasRef.current.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 2, // Higher resolution export
    });

    // Create download link
    const link = document.createElement("a");
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Drawing saved!");
  }, []);

  // Track when canvas has content for undo functionality
  // This would normally use canvas events, simplified here
  const handleCanvasUpdate = useCallback(() => {
    if (canvasRef.current && canvasRef.current.getObjects().length > 0) {
      setCanUndo(true);
    }
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header with title and global actions */}
      <Header
        userCount={userCount}
        onClearAll={handleClearAll}
        onUndo={handleUndo}
        canUndo={canUndo}
      />

      {/* Toolbar with drawing tools */}
      <Toolbar
        activeColor={brushColor}
        brushSize={brushSize}
        isEraser={isEraser}
        onColorChange={handleColorChange}
        onSizeChange={handleSizeChange}
        onEraserToggle={handleEraserToggle}
        onDownload={handleDownload}
      />

      {/* Main canvas area */}
      <Canvas
        brushColor={brushColor}
        brushSize={brushSize}
        isEraser={isEraser}
        canvasRef={canvasRef}
      />

      {/* Footer with instructions */}
      <footer className="px-4 py-2 text-center text-sm text-muted-foreground bg-card border-t border-border">
        Draw with mouse or touch — changes sync instantly
      </footer>
    </div>
  );
};

export default Whiteboard;
