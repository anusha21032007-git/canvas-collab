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
  const [activeTool, setActiveTool] = useState("pencil");

  // Mock user count (would come from Socket.io in real implementation)
  const [userCount] = useState(3);

  // Undo history tracking
  const [canUndo, setCanUndo] = useState(false);

  // Reference to the Fabric.js canvas instance
  const canvasRef = useRef<FabricCanvas | null>(null);

  // Handle color selection
  const handleColorChange = useCallback((color: string) => {
    setBrushColor(color);
    if (activeTool === "eraser") {
      setActiveTool("pencil"); // Switch back to draw mode when selecting color
    }
  }, [activeTool]);

  // Handle brush size change
  const handleSizeChange = useCallback((size: number) => {
    setBrushSize(size);
  }, []);

  // Handle tool change
  const handleToolChange = useCallback((tool: string) => {
    setActiveTool(tool);
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
      setCanUndo(canvasRef.current.getObjects().length > 0);
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
  const handleCanvasUpdate = useCallback(() => {
    if (canvasRef.current) {
      setCanUndo(canvasRef.current.getObjects().length > 0);
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
        activeTool={activeTool}
        onColorChange={handleColorChange}
        onSizeChange={handleSizeChange}
        onToolChange={handleToolChange}
        onDownload={handleDownload}
      />

      {/* Main canvas area */}
      <Canvas
        brushColor={brushColor}
        brushSize={brushSize}
        activeTool={activeTool}
        canvasRef={canvasRef}
        onUpdate={handleCanvasUpdate}
      />

      {/* Footer with instructions */}
      <footer className="px-4 py-2 text-center text-sm text-muted-foreground bg-card border-t border-border">
        Draw with mouse or touch — changes sync instantly
      </footer>
    </div>
  );
};

export default Whiteboard;