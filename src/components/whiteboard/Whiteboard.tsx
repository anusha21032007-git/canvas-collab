import { useState, useRef, useCallback, useEffect } from "react";
import { Canvas as FabricCanvas, Image as FabricImage } from "fabric";
import { toast } from "sonner";
import Header from "./Header";
import Toolbar from "./Toolbar";
import Canvas from "./Canvas";
import BoardControls from "./BoardControls";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId } from "@/lib/session";

const ACTIVE_INDEX_STORAGE_KEY = "whiteboard_active_index";

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
  const [isCanvasReady, setCanvasReady] = useState(false);
  const isInitialLoadRef = useRef(true);
  const sessionIdRef = useRef(getSessionId());

  // Effect to load data from Supabase when the canvas is ready
  useEffect(() => {
    if (isCanvasReady && isInitialLoadRef.current) {
      isInitialLoadRef.current = false;

      const loadData = async () => {
        const loadingToast = toast.loading("Loading your whiteboard...");
        const sessionId = sessionIdRef.current;

        try {
          const { data, error } = await supabase
            .from("boards")
            .select("content, board_index")
            .eq("session_id", sessionId)
            .order("board_index", { ascending: true });

          if (error) throw error;

          const canvas = canvasRef.current;
          if (!canvas) return;

          let activeIndex = 0;
          const savedIndexRaw = localStorage.getItem(ACTIVE_INDEX_STORAGE_KEY);
          if (savedIndexRaw) {
            const savedIndex = JSON.parse(savedIndexRaw);
            if (typeof savedIndex === "number") activeIndex = savedIndex;
          }

          if (data && data.length > 0) {
            const loadedBoards = data.map((b) => b.content || {});
            setBoards(loadedBoards);
            const finalIndex = activeIndex < loadedBoards.length ? activeIndex : 0;
            setActiveBoardIndex(finalIndex);

            canvas.loadFromJSON(loadedBoards[finalIndex] || {}, () => {
              canvas.renderAll();
              setCanUndo(canvas.getObjects().length > 0);
            });
            toast.success("Welcome back! Your work has been restored.", { id: loadingToast });
          } else {
            setBoards([{}]);
            setActiveBoardIndex(0);
            await supabase.from("boards").insert({ session_id: sessionId, board_index: 0, content: {} });
            toast.success("A new whiteboard is ready for you!", { id: loadingToast });
          }
        } catch (err) {
          console.error("Failed to load whiteboard state from Supabase", err);
          toast.error("Could not restore your session.", { id: loadingToast });
        }
      };

      loadData();
    }
  }, [isCanvasReady]);

  // Effect to save active index to localStorage
  useEffect(() => {
    if (!isInitialLoadRef.current) {
      try {
        localStorage.setItem(ACTIVE_INDEX_STORAGE_KEY, JSON.stringify(activeBoardIndex));
      } catch (error) {
        console.error("Failed to save active index to localStorage", error);
      }
    }
  }, [activeBoardIndex]);

  const handleCanvasUpdate = useCallback(() => {
    if (canvasRef.current) {
      setCanUndo(canvasRef.current.getObjects().length > 0);
    }
  }, []);

  const saveBoardState = useCallback(async () => {
    if (!canvasRef.current || isInitialLoadRef.current) return;
    const currentState = canvasRef.current.toJSON();

    setBoards((prevBoards) => {
      const newBoards = [...prevBoards];
      newBoards[activeBoardIndex] = currentState;
      return newBoards;
    });

    const { error } = await supabase.from("boards").upsert(
      {
        session_id: sessionIdRef.current,
        board_index: activeBoardIndex,
        content: currentState,
      },
      { onConflict: "session_id,board_index" },
    );

    if (error) {
      toast.error("Failed to save changes.");
      console.error("Error saving board state:", error);
    }
  }, [activeBoardIndex]);

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
    setCanUndo(false);

    setBoards((prevBoards) => {
      const newBoards = [...prevBoards];
      newBoards[activeBoardIndex] = {};
      return newBoards;
    });

    const { error } = await supabase.from("boards").update({ content: {} }).match({
      session_id: sessionIdRef.current,
      board_index: activeBoardIndex,
    });

    if (error) toast.error("Failed to clear board.");
    else toast.success("Board cleared!");
  }, [activeBoardIndex]);

  const handleUndo = useCallback(async () => {
    if (!canvasRef.current) return;
    const objects = canvasRef.current.getObjects();
    if (objects.length > 0) {
      canvasRef.current.remove(objects[objects.length - 1]);
      canvasRef.current.renderAll();
      setCanUndo(canvasRef.current.getObjects().length > 0);
      await saveBoardState();
      toast("Undo successful");
    }
  }, [saveBoardState]);

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

  const handleImageUpload = useCallback(
    async (file: File) => {
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
          handleCanvasUpdate();
          await saveBoardState();
          toast.success("Image added to canvas!");
        });
      };
      reader.readAsDataURL(file);
    },
    [handleCanvasUpdate, saveBoardState],
  );

  const handleBackgroundUpload = useCallback(
    async (file: File) => {
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
          await saveBoardState();
          toast.success("Background image updated!");
        });
      };
      reader.readAsDataURL(file);
    },
    [saveBoardState],
  );

  const handleAddBoard = async () => {
    await saveBoardState();
    const newIndex = boards.length;

    const { error } = await supabase.from("boards").insert({
      session_id: sessionIdRef.current,
      board_index: newIndex,
      content: {},
    });

    if (error) {
      toast.error("Failed to add new board.");
      return;
    }

    setBoards((prev) => [...prev, {}]);
    setActiveBoardIndex(newIndex);

    if (canvasRef.current) {
      canvasRef.current.clear();
      canvasRef.current.backgroundColor = "#ffffff";
      canvasRef.current.renderAll();
      setCanUndo(false);
    }
    toast.success(`Switched to new Board ${newIndex + 1}`);
  };

  const handleSwitchBoard = async (index: number) => {
    if (index === activeBoardIndex) return;

    await saveBoardState();
    setActiveBoardIndex(index);

    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.loadFromJSON(boards[index] || {}, () => {
        canvas.renderAll();
        setCanUndo(canvas.getObjects().length > 0);
      });
    }
    toast.info(`Switched to Board ${index + 1}`);
  };

  const handleDeleteBoard = async (index: number) => {
    if (boards.length <= 1) {
      toast.error("Cannot delete the last board.");
      return;
    }

    const sessionId = sessionIdRef.current;
    const { error: deleteError } = await supabase.from("boards").delete().match({
      session_id: sessionId,
      board_index: index,
    });

    if (deleteError) {
      toast.error("Failed to delete board.");
      return;
    }

    const updates = [];
    for (let i = index + 1; i < boards.length; i++) {
      updates.push(
        supabase.from("boards").update({ board_index: i - 1 }).match({
          session_id: sessionId,
          board_index: i,
        }),
      );
    }
    await Promise.all(updates);

    let newActiveIndex = activeBoardIndex;
    if (index === activeBoardIndex) newActiveIndex = Math.max(0, index - 1);
    else if (index < activeBoardIndex) newActiveIndex = activeBoardIndex - 1;

    const newBoards = boards.filter((_, i) => i !== index);
    setBoards(newBoards);
    setActiveBoardIndex(newActiveIndex);

    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.loadFromJSON(newBoards[newActiveIndex] || {}, () => {
        canvas.renderAll();
        setCanUndo(canvas.getObjects().length > 0);
      });
    }
    toast.success(`Board ${index + 1} deleted.`);
  };

  const handleCanvasReady = useCallback(() => {
    setCanvasReady(true);
  }, []);

  const handleCanvasUpdateAndSave = useCallback(async () => {
    handleCanvasUpdate();
    await saveBoardState();
  }, [handleCanvasUpdate, saveBoardState]);

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header userCount={userCount} onClearAll={handleClearAll} onUndo={handleUndo} canUndo={canUndo} />
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
        onUpdate={handleCanvasUpdateAndSave}
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