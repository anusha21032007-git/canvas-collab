import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, Edit } from "lucide-react";

interface JoinRoomDialogProps {
  isOpen: boolean;
  onJoin: (role: "viewer" | "editor") => void;
  isJoining: boolean;
}

const JoinRoomDialog = ({ isOpen, onJoin, isJoining }: JoinRoomDialogProps) => {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Join Whiteboard</DialogTitle>
          <DialogDescription>
            Choose how you want to join this whiteboard. You can either view it or collaborate with others.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button
            onClick={() => onJoin("editor")}
            disabled={isJoining}
            size="lg"
            className="w-full"
          >
            <Edit className="mr-2 h-5 w-5" />
            {isJoining ? "Joining..." : "Join and Collaborate"}
          </Button>
          <Button
            onClick={() => onJoin("viewer")}
            disabled={isJoining}
            variant="secondary"
            size="lg"
            className="w-full"
          >
            <Eye className="mr-2 h-5 w-5" />
            {isJoining ? "Joining..." : "View Only"}
          </Button>
        </div>
        <DialogFooter>
          <p className="text-sm text-muted-foreground text-center w-full">
            Your choice will be saved for future visits to this board.
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JoinRoomDialog;