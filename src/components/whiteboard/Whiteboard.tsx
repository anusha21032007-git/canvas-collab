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

  // Undo/Redo state
  const boardHistory = useRef<Array<Array<object>>>([[{}]]);
  const boardHistoryIndex = useRef<Array<number>>([0]);
  const isRestoringHistory = useRef(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Reference to the Fabric.js canvas instance
  const canvasRef = useRef<FabricCanvas | null>(null);
  const [isCanvasReady, setCanvasReady] = useState(false);
  const isInitialLoadRef = useRef(true);
  const sessionIdRef = useRef(getSessionId());

  // Effect to update undo/redo buttons state whenever the history or active board changes
  useEffect(() => {
    const history = boardHistory.current[activeBoardIndex] || [];
    const index = boardHistoryIndex.current[activeBoardIndex] ?? -1;
    setCanUndo(index > 0);
    setCanRedo(index < history.length - 1);
  }, [activeBoardIndex, boards]); // `boards` is a proxy for history changes

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
            boardHistory.current = loadedBoards.map((board) => [board]);
            boardHistoryIndex.current = loadedBoards.map(() => 0);

            const finalIndex = activeIndex < loadedBoards.length ? activeIndex : 0;
            setActiveBoardIndex(finalIndex);

            canvas.loadFromJSON(loadedBoards[finalIndex] || {}, () => {
              canvas.renderAll();
            });
            toast.success("Welcome back! Your work has been restored.", { id: loadingToast });
          } else {
            setBoards([{}]);
            setActiveBoardIndex(0);
            boardHistory.current = [[{}]];
            boardHistoryIndex.current = [0];
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

  const saveBoardStateToSupabase = useCallback(async (stateToSave: object, boardIndex: number) => {
    if (isInitialLoadRef.current) return;
    const { error } = await supabase.from("boards").upsert(
      {
        session_id: sessionIdRef.current,
        board_index: boardIndex,
        content: stateToSave,
      },
      { onConflict: "session_id,board_index" },
    );

    if (error) {
      toast.error("Failed to save changes.");
      console.error("Error saving board state:", error);
    }
  }, []);

  const updateHistoryAndSave = useCallback(async () => {
    if (!canvasRef.current || isRestoringHistory.current) return;

    const currentState = canvasRef.current.toJSON();
    const history = boardHistory.current[activeBoardIndex];
    const index = boardHistoryIndex.current[activeBoardIndex];

    const newHistory = history.slice(0, index + 1);
    newHistory.push(currentState);
    boardHistory.current[activeBoardIndex] = newHistory;
    boardHistoryIndex.current[activeBoardIndex] = newHistory.length - 1;

    setBoards((prevBoards) => {
      const newBoards = [...prevBoards];
      newBoards[activeBoardIndex] = currentState;
      return newBoards;
    });

    await saveBoardStateToSupabase(currentState, activeBoardIndex);
  }, [activeBoardIndex, saveBoardStateToSupabase]);

  const handleUndo = useCallback(async () => {
    const index = boardHistoryIndex.current[activeBoardIndex];
    if (index <= 0) return;

    isRestoringHistory.current = true;
    const newIndex = index - 1;
    boardHistoryIndex.current[activeBoardIndex] = newIndex;
    const prevState = boardHistory.current[activeBoardIndex][newIndex];

    canvasRef.current?.loadFromJSON(prevState, async () => {
      canvasRef.current?.renderAll();
      setBoards((prev) => {
        const newBoards = [...prev];
        newBoards[activeBoardIndex] = prevState;
        return newBoards;
      });
      await saveBoardStateToSupabase(prevState, activeBoardIndex);
      isRestoringHistory.current = false;
      toast("Undo successful");
    });
  }, [activeBoardIndex, saveBoardStateToSupabase]);

  const handleRedo = useCallback(async () => {
    const history = boardHistory.current[activeBoardIndex];
    const index = boardHistoryIndex.current[activeBoardIndex];
    if (index >= history.length - 1) return;

    isRestoringHistory.current = true;
    const newIndex = index + 1;
    boardHistoryIndex.current[activeBoardIndex] = newIndex;
    const nextState = history[newIndex];

    canvasRef.current?.loadFromJSON(nextState, async () => {
      canvasRef.current?.renderAll();
      setBoards((prev) => {
        const newBoards = [...prev];
        newBoards[activeBoardIndex] = nextState;
        return newBoards;
      });
      await saveBoardStateToSupabase(nextState, activeBoardIndex);
      isRestoringHistory.current = false;
      toast("Redo successful");
    });
  }, [activeBoardIndex, saveBoardStateToSupabase]);

  const handleColorChange = useCallback(
    (color: string) => {
      setBrushColor(color);
      if (activeTool === "eraser") setActiveTool("pencil");
    },
    [activeTool],
  );

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
          await updateHistoryAndSave();
          toast.success("Image added to canvas!");
        });
      };
      reader.readAsDataURL(file);
    },
    [updateHistoryAndSave],
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
          await updateHistoryAndSave();
          toast.success("Background image updated!");
        });
      };
      reader.readAsDataURL(file);
    },
    [updateHistoryAndSave],
  );

  const handleAddBoard = async () => {
    await updateHistoryAndSave();
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

    boardHistory.current.push([{}]);
    boardHistoryIndex.current.push(0);
    setBoards((prev) => [...prev, {}]);
    setActiveBoardIndex(newIndex);

    if (canvasRef.current) {
      canvasRef.current.clear();
      canvasRef.current.backgroundColor = "#ffffff";
      canvasRef.current.renderAll();
    }
    toast.success(`Switched to new Board ${newIndex + 1}`);
  };

  const handleSwitchBoard = async (index: number) => {
    if (index === activeBoardIndex) return;

    await updateHistoryAndSave();
    setActiveBoardIndex(index);

    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const boardState = boardHistory.current[index][boardHistoryIndex.current[index]];
      canvas.loadFromJSON(boardState || {}, () => {
        canvas.renderAll();
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

    boardHistory.current.splice(index, 1);
    boardHistoryIndex.current.splice(index, 1);

    let newActiveIndex = activeBoardIndex;
    if (index === activeBoardIndex) newActiveIndex = Math.max(0, index - 1);
    else if (index < activeBoardIndex) newActiveIndex = activeBoardIndex - 1;

    const newBoards = boards.filter((_, i) => i !== index);
    setBoards(newBoards);
    setActiveBoardIndex(newActiveIndex);

    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const boardState = boardHistory.current[newActiveIndex][boardHistoryIndex.current[newActiveIndex]];
      canvas.loadFromJSON(boardState || {}, () => {
        canvas.renderAll();
      });
    }
    toast.success(`Board ${index + 1} deleted.`);
  };

  const handleCanvasReady = useCallback(() => {
    setCanvasReady(true);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background">
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