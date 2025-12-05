import { Users, Trash2, Undo2, Redo2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

interface HeaderProps {
  roomId: string;
  userCount: number;
  onClearAll: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

/**
 * Header component displaying the app title, user count, and action buttons
 */
const Header = ({ roomId, userCount, onClearAll, onUndo, onRedo, canUndo, canRedo }: HeaderProps) => {
  const handleShare = () => {
    const inviteLink = `${window.location.origin}/whiteboard/${roomId}`;
    navigator.clipboard.writeText(inviteLink);
    toast.success("Invitation link copied to clipboard!");
  };

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

        {/* Share button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="tool-transition"
            >
              <Share2 size={18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Share & Invite</p>
          </TooltipContent>
        </Tooltip>

        {/* Undo button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onUndo}
              disabled={!canUndo}
              className="tool-transition"
            >
              <Undo2 size={18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Undo</p>
          </TooltipContent>
        </Tooltip>

        {/* Redo button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRedo}
              disabled={!canRedo}
              className="tool-transition"
            >
              <Redo2 size={18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Redo</p>
          </TooltipContent>
        </Tooltip>

        {/* Clear all button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClearAll}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 tool-transition"
            >
              <Trash2 size={18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Clear All</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
};

export default Header;