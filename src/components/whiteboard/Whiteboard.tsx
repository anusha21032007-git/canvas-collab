import { useState, useRef, useCallback } from "react";
import { Canvas as FabricCanvas, Image as FabricImage } from "fabric";
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

  // Track when canvas has content for undo functionality
  const handleCanvasUpdate = useCallback(() => {
    if (canvasRef.current) {
      setCanUndo(canvasRef.current.getObjects().length > 0);
    }
  }, []);

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

    const dataURL = canvasRef.current.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 2,
    });

    const link = document.createElement("a");
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Drawing saved!");
  }, []);

  // Handle uploading an image as an object
  const handleImageUpload = useCallback((file: File) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const reader = new FileReader();
    reader.onload = (e) => {
      const imgUrl = e.target?.result as string;
      FabricImage.fromURL(imgUrl, (img) => {
        img.scaleToWidth(300);
        canvas.centerObject(img);
        canvas.add(img);
        canvas.renderAll();
        handleCanvasUpdate();
        toast.success("Image added to canvas!");
      });
    };
    reader.readAsDataURL(file);
  }, [handleCanvasUpdate]);

  // Handle uploading an image as the canvas background
  const handleBackgroundUpload = useCallback((file: File) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const reader = new FileReader();
    reader.onload = (e) => {
      const imgUrl = e.target?.result as string;
      FabricImage.fromURL(imgUrl, (img) => {
        if (canvas.width && canvas.height) {
          canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
            scaleX: canvas.width / (img.width || 1),
            scaleY: canvas.height / (img.height || 1),
          });
        }
        toast.success("Background image updated!");
      });
    };
    reader.readAsDataURL(file);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header
        userCount={userCount}
        onClearAll={handleClearAll}
        onUndo={handleUndo}
        canUndo={canUndo}
      />

      <Toolbar
        activeColor={brushColor}
        brushSize={brushSize}
        activeTool={activeTool}
        onColorChange={handleColorChange}
        onSizeChange={handleSizeChange}
        onToolChange={handleToolChange}
        onDownload={handleDownload}
        onImageUpload={handleImageUpload}
        onBackgroundUpload={handleBackgroundUpload}
      />

      <Canvas
        brushColor={brushColor}
        brushSize={brushSize}
        activeTool={activeTool}
        canvasRef={canvasRef}
        onUpdate={handleCanvasUpdate}
      />

      <footer className="px-4 py-2 text-center text-sm text-muted-foreground bg-card border-t border-border">
        Draw with mouse or touch — changes sync instantly
      </footer>
    </div>
  );
};

export default Whiteboard;