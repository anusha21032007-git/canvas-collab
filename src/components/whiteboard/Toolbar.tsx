import {
  Paintbrush,
  Eraser,
  Download,
  Circle,
  Square,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Brush color options with their CSS variable names
const COLORS = [
  { name: "black", value: "hsl(0, 0%, 10%)", cssVar: "brush-black" },
  { name: "red", value: "hsl(0, 72%, 51%)", cssVar: "brush-red" },
  { name: "blue", value: "hsl(217, 91%, 60%)", cssVar: "brush-blue" },
  { name: "green", value: "hsl(142, 71%, 45%)", cssVar: "brush-green" },
];

// Brush size options
const SIZES = [
  { name: "Small", value: 2 },
  { name: "Medium", value: 6 },
  { name: "Large", value: 12 },
];

// Tool options
const TOOLS = [
  { name: "pencil", icon: Paintbrush, label: "Draw" },
  { name: "rectangle", icon: Square, label: "Rectangle" },
  { name: "circle", icon: Circle, label: "Circle" },
  { name: "line", icon: Minus, label: "Line" },
  { name: "eraser", icon: Eraser, label: "Eraser" },
];

interface ToolbarProps {
  activeColor: string;
  brushSize: number;
  activeTool: string;
  onColorChange: (color: string) => void;
  onSizeChange: (size: number) => void;
  onToolChange: (tool: string) => void;
  onDownload: () => void;
}

/**
 * Toolbar component with drawing tools: color picker, brush size, eraser, and download
 */
const Toolbar = ({
  activeColor,
  brushSize,
  activeTool,
  onColorChange,
  onSizeChange,
  onToolChange,
  onDownload,
}: ToolbarProps) => {
  const isDrawingTool =
    activeTool === "pencil" ||
    activeTool === "rectangle" ||
    activeTool === "circle" ||
    activeTool === "line";

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 px-4 py-3 bg-toolbar border-b border-border">
      {/* Tool buttons */}
      <div className="flex items-center gap-2">
        {TOOLS.map((tool) => (
          <Button
            key={tool.name}
            variant={activeTool === tool.name ? "default" : "secondary"}
            size="sm"
            onClick={() => onToolChange(tool.name)}
            className="tool-transition"
            aria-label={tool.label}
          >
            <tool.icon size={18} />
            <span className="ml-1.5 hidden sm:inline">{tool.label}</span>
          </Button>
        ))}
      </div>

      {/* Divider */}
      <div className="h-8 w-px bg-border" />

      {/* Color picker section */}
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
              <Circle
                size={size.value + 8}
                fill="currentColor"
                strokeWidth={0}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-8 w-px bg-border" />

      {/* Download button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onDownload}
        className="tool-transition"
      >
        <Download size={18} />
        <span className="ml-1.5">Download</span>
      </Button>
    </div>
  );
};

export default Toolbar;