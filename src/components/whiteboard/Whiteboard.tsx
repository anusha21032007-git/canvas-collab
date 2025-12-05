import { useState, useRef, useCallback, useEffect } from "react";
import { Canvas as FabricCanvas, Image as FabricImage } from "fabric";
import { toast } from "sonner";
import Header from "./Header";
import Toolbar from "./Toolbar";
import Canvas from "./Canvas";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "../ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface WhiteboardProps {
  roomId: string;
}

/**
 * Main Whiteboard component that orchestrates all whiteboard functionality
 * Manages state for drawing tools and coordinates between components
 */
const Whiteboard = ({ roomId }: WhiteboardProps) => {
  const { user } = useAuth();
  // Drawing state
  const [brushColor, setBrushColor] = useState("hsl(0, 0%, 10%)");
  const [brushSize, setBrushSize] = useState(6);
  const [activeTool, setActiveTool] = useState("pencil");

  // Mock user count
  const [userCount] = useState(1);

  // Undo/Redo state
  const history = useRef<object[]>([]);
  const historyIndex = useRef(-1);
  const isRestoringHistory = useRef(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Reference to the Fabric.js canvas instance
  const canvasRef = useRef<FabricCanvas | null>(null);
  const [isCanvasReady, setCanvasReady] = useState(false);
  const isInitialLoadRef = useRef(true);

  // Effect to update undo/redo buttons state
  useEffect(() => {
    setCanUndo(historyIndex.current > 0);
    setCanRedo(historyIndex.current < history.current.length - 1);
  }, [historyIndex.current, history.current.length]);

  const saveBoardStateToSupabase = useCallback(
    async (stateToSave: object) => {
      if (isInitialLoadRef.current) return;
      const { error } = await supabase.from("boards").upsert(
        {
          room_id: roomId,
          board_index: 0, // Simplified to one board per room for now
          content: stateToSave,
        },
        { onConflict: "room_id,board_index" },
      );

      if (error) {
        toast.error("Failed to save changes.");
        console.error("Error saving board state:", error);
      }
    },
    [roomId],
  );

  const updateHistoryAndSave = useCallback(async () => {
    if (!canvasRef.current || isRestoringHistory.current) return;

    const currentState = canvasRef.current.toJSON();
    const newHistory = history.current.slice(0, historyIndex.current + 1);
    newHistory.push(currentState);
    history.current = newHistory;
    historyIndex.current = newHistory.length - 1;

    setCanUndo(historyIndex.current > 0);
    setCanRedo(false);

    await saveBoardStateToSupabase(currentState);
  }, [saveBoardStateToSupabase]);

  // Effect to load data from Supabase when the canvas is ready
  useEffect(() => {
    if (isCanvasReady && user) {
      const loadData = async () => {
        const loadingToast = toast.loading("Loading whiteboard...");

        try {
          const { data, error } = await supabase
            .from("boards")
            .select("content")
            .eq("room_id", roomId)
            .eq("board_index", 0)
            .maybeSingle();

          if (error) throw error;

          const canvas = canvasRef.current;
          if (!canvas) return;

          const boardContent = data?.content || {};
          canvas.loadFromJSON(boardContent, () => {
            canvas.renderAll();
            history.current = [boardContent];
            historyIndex.current = 0;
            setCanUndo(false);
            setCanRedo(false);
            isInitialLoadRef.current = false;
            toast.success("Whiteboard loaded!", { id: loadingToast });
          });
        } catch (err) {
          console.error("Failed to load whiteboard state", err);
          toast.error("Could not load whiteboard.", { id: loadingToast });
        }
      };

      loadData();
    }
  }, [isCanvasReady, roomId, user]);

  const handleUndo = useCallback(async () => {
    if (historyIndex.current <= 0) return;

    isRestoringHistory.current = true;
    historyIndex.current--;
    const prevState = history.current[historyIndex.current];

    canvasRef.current?.loadFromJSON(prevState, async () => {
      canvasRef.current?.renderAll();
      await saveBoardStateToSupabase(prevState);
      isRestoringHistory.current = false;
      toast("Undo successful");
      setCanUndo(historyIndex.current > 0);
      setCanRedo(true);
    });
  }, [saveBoardStateToSupabase]);

  const handleRedo = useCallback(async () => {
    if (historyIndex.current >= history.current.length - 1) return;

    isRestoringHistory.current = true;
    historyIndex.current++;
    const nextState = history.current[historyIndex.current];

    canvasRef.current?.loadFromJSON(nextState, async () => {
      canvasRef.current?.renderAll();
      await saveBoardStateToSupabase(nextState);
      isRestoringHistory.current = false;
      toast("Redo successful");
      setCanUndo(true);
      setCanRedo(historyIndex.current < history.current.length - 1);
    });
  }, [saveBoardStateToSupabase]);

  const handleColorChange = useCallback((color: string) => {
    setBrushColor(color);
    if (activeTool === "eraser") setActiveTool("pencil");
  }, [activeTool]);

  const handleSizeChange = useCallback((size: number) => setBrushSize(size), []);
  const handleToolChange = useCallback((tool: string) => setActiveTool(tool), []);

  const handleClearAll = useCallback(async () => {
    if (!canvasRef.current) return;
    canvasRef.current.clear();
    canvasRef.current.backgroundColor = "#ffffff";
    canvasRef.current.renderAll();
    await updateHistoryAndSave();
    toast.success("Board cleared!");
  }, [updateHistoryAndSave]);

  const handleDownload = useCallback(() => {
    if (!canvasRef.current) return;
    const dataURL = canvasRef.current.toDataURL({ format: "png", quality: 1, multiplier: 2 });
    const link = document.createElement("a");
    link.download = `whiteboard-${roomId}-${Date.now()}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Board saved as PNG!");
  }, [roomId]);

  const handleImageUpload = useCallback(async (file: File) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const reader = new FileReader();
    reader.onload = (e) => {
      const imgUrl = e.target?.result as string;
      FabricImage.fromURL(imgUrl, async (img) => {
        img.scaleToWidth(300);
        canvas.centerObject(img);
        canvas.add(img);
        canvas.renderAll();
        await updateHistoryAndSave();
        toast.success("Image added to canvas!");
      });
    };
    reader.readAsDataURL(file);
  }, [updateHistoryAndSave]);

  const handleBackgroundUpload = useCallback(async (file: File) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const reader = new FileReader();
    reader.onload = (e) => {
      const imgUrl = e.target?.result as string;
      FabricImage.fromURL(imgUrl, async (img) => {
        if (canvas.width && canvas.height) {
          canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
            scaleX: canvas.width / (img.width || 1),
            scaleY: canvas.height / (img.height || 1),
          });
        }
        await updateHistoryAndSave();
        toast.success("Background image updated!");
      });
    };
    reader.readAsDataURL(file);
  }, [updateHistoryAndSave]);

  const handleCanvasReady = useCallback(() => {
    setCanvasReady(true);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="absolute top-4 left-4 z-10">
        <Button asChild variant="outline" size="sm">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Rooms
          </Link>
        </Button>
      </div>
      <Header
        userCount={userCount}
        onClearAll={handleClearAll}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
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
        onReady={handleCanvasReady}
        onUpdate={updateHistoryAndSave}
      />
    </div>
  );
};

export default Whiteboard;