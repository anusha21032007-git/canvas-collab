import { useState, useRef, useCallback } from "react";
import { Canvas as FabricCanvas, Image as FabricImage } from "fabric";
import { toast } from "sonner";
import Header from "./Header";
import Toolbar from "./Toolbar";
import Canvas from "./Canvas";
import BoardControls from "./BoardControls";

/**
 * Main Whiteboard component that orchestrates all whiteboard functionality
 * Manages state for drawing tools and coordinates between components
 */
const Whiteboard = () => {
  // Board management state
  const [boards, setBoards] = useState<object[]>([{}]);
  const [activeBoardIndex, setActiveBoardIndex] = useState(0);

  // Drawing state
  const [brushColor, setBrushColor] = useState("hsl(0, 0%, 10%)");
  const [brushSize, setBrushSize] = useState(6);
  const [activeTool, setActiveTool] = useState("pencil");

  // Mock user count
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

  // Save the current canvas state to the boards array
  const saveBoardState = useCallback(() => {
    if (!canvasRef.current) return;
    const currentState = canvasRef.current.toJSON();
    setBoards((prevBoards) => {
      const newBoards = [...prevBoards];
      newBoards[activeBoardIndex] = currentState;
      return newBoards;
    });
  }, [activeBoardIndex]);

  // Handle color selection
  const handleColorChange = useCallback((color: string) => {
    setBrushColor(color);
    if (activeTool === "eraser") setActiveTool("pencil");
  }, [activeTool]);

  // Handle brush size change
  const handleSizeChange = useCallback((size: number) => setBrushSize(size), []);

  // Handle tool change
  const handleToolChange = useCallback((tool: string) => setActiveTool(tool), []);

  // Clear all drawings from the current board
  const handleClearAll = useCallback(() => {
    if (!canvasRef.current) return;
    canvasRef.current.clear();
    canvasRef.current.backgroundColor = "#ffffff";
    canvasRef.current.renderAll();
    setCanUndo(false);
    setBoards((prevBoards) => {
      const newBoards = [...prevBoards];
      newBoards[activeBoardIndex] = {};
      return newBoards;
    });
    toast.success("Board cleared!");
  }, [activeBoardIndex]);

  // Undo the last action and save the new state
  const handleUndo = useCallback(() => {
    if (!canvasRef.current) return;
    const objects = canvasRef.current.getObjects();
    if (objects.length > 0) {
      canvasRef.current.remove(objects[objects.length - 1]);
      canvasRef.current.renderAll();
      setCanUndo(canvasRef.current.getObjects().length > 0);
      saveBoardState();
      toast("Undo successful");
    }
  }, [saveBoardState]);

  // Download canvas as PNG image
  const handleDownload = useCallback(() => {
    if (!canvasRef.current) return;
    const dataURL = canvasRef.current.toDataURL({ format: "png", quality: 1, multiplier: 2 });
    const link = document.createElement("a");
    link.download = `whiteboard-board-${activeBoardIndex + 1}-${Date.now()}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Board saved as PNG!");
  }, [activeBoardIndex]);

  // Handle image uploads
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
        saveBoardState();
        toast.success("Image added to canvas!");
      });
    };
    reader.readAsDataURL(file);
  }, [handleCanvasUpdate, saveBoardState]);

  // Handle background uploads
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
        saveBoardState();
        toast.success("Background image updated!");
      });
    };
    reader.readAsDataURL(file);
  }, [saveBoardState]);

  // --- Board Management Functions ---

  const handleAddBoard = () => {
    saveBoardState();
    setBoards((prev) => [...prev, {}]);
    setActiveBoardIndex(boards.length);
    if (canvasRef.current) {
      canvasRef.current.clear();
      canvasRef.current.backgroundColor = "#ffffff";
      canvasRef.current.renderAll();
      setCanUndo(false);
    }
    toast.success(`Switched to new Board ${boards.length + 1}`);
  };

  const handleSwitchBoard = (index: number) => {
    if (index === activeBoardIndex) return;
    saveBoardState();
    setActiveBoardIndex(index);
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.loadFromJSON(boards[index], () => {
        canvas.renderAll();
        setCanUndo(canvas.getObjects().length > 0);
      });
    }
    toast.info(`Switched to Board ${index + 1}`);
  };

  const handleDeleteBoard = (index: number) => {
    if (boards.length <= 1) {
      toast.error("Cannot delete the last board.");
      return;
    }
    saveBoardState();
    const newBoards = boards.filter((_, i) => i !== index);
    setBoards(newBoards);

    let newActiveIndex = activeBoardIndex;
    if (index === activeBoardIndex) {
      newActiveIndex = Math.max(0, index - 1);
    } else if (index < activeBoardIndex) {
      newActiveIndex = activeBoardIndex - 1;
    }
    
    setActiveBoardIndex(newActiveIndex);

    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.loadFromJSON(newBoards[newActiveIndex], () => {
        canvas.renderAll();
        setCanUndo(canvas.getObjects().length > 0);
      });
    }
    toast.success(`Board ${index + 1} deleted.`);
  };

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
        onUpdate={() => {
          handleCanvasUpdate();
          saveBoardState();
        }}
      />

      <BoardControls
        boardCount={boards.length}
        activeBoardIndex={activeBoardIndex}
        onAddBoard={handleAddBoard}
        onSwitchBoard={handleSwitchBoard}
        onDeleteBoard={handleDeleteBoard}
      />
    </div>
  );
};

export default Whiteboard;