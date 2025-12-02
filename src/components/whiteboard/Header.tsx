import { Users, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  userCount: number;
  onClearAll: () => void;
  onUndo: () => void;
  canUndo: boolean;
}

/**
 * Header component displaying the app title, user count, and action buttons
 */
const Header = ({ userCount, onClearAll, onUndo, canUndo }: HeaderProps) => {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border toolbar-shadow">
      {/* App title */}
      <h1 className="text-lg font-semibold text-foreground">
        Collaborative Whiteboard
      </h1>

      {/* Right side actions */}
      <div className="flex items-center gap-3">
        {/* Active users indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full">
          <Users size={16} className="text-muted-foreground" />
          <span className="text-sm font-medium text-secondary-foreground">
            {userCount} online
          </span>
          <span className="w-2 h-2 bg-success rounded-full animate-pulse-soft" />
        </div>

        {/* Undo button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          className="tool-transition"
        >
          <Undo2 size={18} />
          <span className="ml-1.5 hidden sm:inline">Undo</span>
        </Button>

        {/* Clear all button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-destructive hover:text-destructive hover:bg-destructive/10 tool-transition"
        >
          <Trash2 size={18} />
          <span className="ml-1.5 hidden sm:inline">Clear All</span>
        </Button>
      </div>
    </header>
  );
};

export default Header;
