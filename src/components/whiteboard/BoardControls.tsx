import { PlusCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BoardControlsProps {
  boardCount: number;
  activeBoardIndex: number;
  onAddBoard: () => void;
  onSwitchBoard: (index: number) => void;
  onDeleteBoard: (index: number) => void;
}

const BoardControls = ({
  boardCount,
  activeBoardIndex,
  onAddBoard,
  onSwitchBoard,
  onDeleteBoard,
}: BoardControlsProps) => {
  const boards = Array.from({ length: boardCount }, (_, i) => i);

  return (
    <div className="flex items-center justify-center gap-2 px-4 py-2 bg-card border-t border-border">
      {boards.map((index) => (
        <div key={index} className="relative group">
          <Button
            variant={activeBoardIndex === index ? "default" : "secondary"}
            className="pr-8"
            onClick={() => onSwitchBoard(index)}
          >
            Board {index + 1}
          </Button>
          {boardCount > 1 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1/2 right-0 transform -translate-y-1/2 h-full w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteBoard(index);
                  }}
                >
                  <X size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete Board</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      ))}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={onAddBoard}>
            <PlusCircle size={24} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Add New Board</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default BoardControls;