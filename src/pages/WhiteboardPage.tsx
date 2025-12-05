import Whiteboard from "@/components/whiteboard/Whiteboard";
import { useParams } from "react-router-dom";

/**
 * WhiteboardPage - renders the collaborative whiteboard for a specific room
 */
const WhiteboardPage = () => {
  const { roomId } = useParams<{ roomId: string }>();

  if (!roomId) {
    return <div>Error: Room ID is missing.</div>;
  }

  return <Whiteboard roomId={roomId} />;
};

export default WhiteboardPage;