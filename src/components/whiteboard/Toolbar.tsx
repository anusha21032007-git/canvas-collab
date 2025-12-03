import {
  Paintbrush,
  Eraser,
  Download,
  Circle,
  Square,
  Minus,
  Shapes,
  Type,
  StickyNote,
  ImagePlus,
  Image as ImageIcon,
} from "lucide-react";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import IconTooltip from "@/components/IconTooltip";

// Brush color options
const COLORS = [
  { name: "black", value: "hsl(0, 0%, 10%)" },
  { name: "red", value: "hsl(0, 72%, 51%)" },
  { name: "blue", value: "hsl(217, 91%, 60%)" },
  { name: "green", value: "hsl(142, 71%, 45%)" },
];

// Brush size options
const SIZES = [
  { name: "Small", value: 2 },
  { name: "Medium", value: 6 },
  { name: "Large", value: 12 },
];

// Tool options
const PRIMARY_TOOLS = [
  { name: "pencil", icon: Paintbrush, label: "Draw" },
  { name: "text", icon: Type, label: "Text" },
  { name: "sticky-note", icon: StickyNote, label: "Sticky Note" },
  { name: "eraser", icon: Eraser, label: "Eraser" },
];

const SHAPE_TOOLS = [
  { name: "rectangle", icon: Square, label: "Rectangle" },
  { name: "circle", icon: Circle, label: "Circle" },
  { name: "line", icon: Minus, label: "Line" },
];

interface ToolbarProps {
  activeColor: string;
  brushSize: number;
  activeTool: string;
  onColorChange: (color: string) => void;
  onSizeChange: (size: number) => void;
  onToolChange: (tool: string) => void;
  onDownload: () => void;
  onImageUpload: (file: File) => void;
  onBackgroundUpload: (file: File) => void;
}

const Toolbar = ({
  activeColor,
  brushSize,
  activeTool,
  onColorChange,
  onSizeChange,
  onToolChange,
  onDownload,
  onImageUpload,
  onBackgroundUpload,
}: ToolbarProps) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const isDrawingTool = ["pencil", "rectangle", "circle", "line", "text"].includes(activeTool);
  const isShapeToolActive = SHAPE_TOOLS.some((t) => t.name === activeTool);
  const activeShape = SHAPE_TOOLS.find((t) => t.name === activeTool);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, handler: (file: File) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      handler(file);
    }
    e.target.value = ""; // Reset input to allow uploading the same file again
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 px-4 py-3 bg-toolbar border-b border-border">
      {/* Primary Tool buttons */}
      <div className="flex items-center gap-3">
        {PRIMARY_TOOLS.map((tool) => (
          <IconTooltip
            key={tool.name}
            label={tool.label}
            toolName={tool.name}
            onClick={() => onToolChange(tool.name)}
            isActive={activeTool === tool.name}
            aria-label={tool.label}
          >
            <tool.icon />
          </IconTooltip>
        ))}

        {/* Shapes Dropdown */}
        <div className="icon-content">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                data-tool="shapes"
                className={cn(isShapeToolActive && "active")}
                aria-label="Shapes"
              >
                <div className="filled"></div>
                {activeShape ? <activeShape.icon /> : <Shapes />}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {SHAPE_TOOLS.map((tool) => (
                <DropdownMenuItem
                  key={tool.name}
                  onClick={() => onToolChange(tool.name)}
                  className={cn("cursor-pointer", activeTool === tool.name && "bg-accent text-accent-foreground")}
                >
                  <tool.icon className="mr-2 h-4 w-4" />
                  <span>{tool.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="tooltip">{activeShape ? activeShape.label : "Shapes"}</div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-8 w-px bg-border" />

      {/* Color picker */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground mr-1">Color</span>
        <div className="flex items-center gap-1.5">
          {COLORS.map((color) => (
            <button
              key={color.name}
              onClick={() => onColorChange(color.value)}
              className={cn(
                "w-8 h-8 rounded-full tool-transition border-2",
                activeColor === color.value && isDrawingTool
                  ? "border-tool-active scale-110 shadow-md"
                  : "border-transparent hover:scale-105"
              )}
              style={{ backgroundColor: color.value }}
              aria-label={`Select ${color.name} color`}
            />
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-8 w-px bg-border" />

      {/* Brush size selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground mr-1">Size</span>
        <div className="flex items-center gap-1">
          {SIZES.map((size) => (
            <button
              key={size.name}
              onClick={() => onSizeChange(size.value)}
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-lg tool-transition",
                brushSize === size.value
                  ? "bg-tool-active text-primary-foreground"
                  : "bg-secondary hover:bg-tool-hover text-secondary-foreground"
              )}
              aria-label={`Select ${size.name} brush size`}
            >
              <Circle size={size.value + 8} fill="currentColor" strokeWidth={0} />
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-8 w-px bg-border" />

      {/* Insert/Upload tools */}
      <div className="flex items-center gap-3">
        <IconTooltip
          label="Upload Image"
          toolName="image"
          onClick={() => imageInputRef.current?.click()}
        >
          <ImagePlus />
        </IconTooltip>
        <IconTooltip
          label="Set Background"
          toolName="background"
          onClick={() => bgInputRef.current?.click()}
        >
          <ImageIcon />
        </IconTooltip>
        <IconTooltip label="Download" toolName="download" onClick={onDownload}>
          <Download />
        </IconTooltip>
      </div>

      {/* Hidden file inputs */}
      <input
        type="file"
        ref={imageInputRef}
        onChange={(e) => handleFileChange(e, onImageUpload)}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={bgInputRef}
        onChange={(e) => handleFileChange(e, onBackgroundUpload)}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};

export default Toolbar;