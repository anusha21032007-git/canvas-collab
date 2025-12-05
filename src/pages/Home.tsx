import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Room {
  id: string;
  name: string;
  owner_id: string;
}

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: rooms, isLoading } = useQuery({
    queryKey: ["rooms", user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Use the new RPC function to fetch rooms
      const { data, error } = await supabase.rpc("get_my_rooms");
      if (error) throw new Error(error.message);
      return data as Room[];
    },
    enabled: !!user,
  });

  const createRoomMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not logged in");
      const { data, error } = await supabase
        .from("rooms")
        .insert({ owner_id: user.id, name: "New Whiteboard" })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Room;
    },
    onSuccess: (newRoom) => {
      queryClient.invalidateQueries({ queryKey: ["rooms", user?.id] });
      navigate(`/whiteboard/${newRoom.id}`);
      toast.success("New whiteboard created!");
    },
    onError: (error) => {
      toast.error(`Failed to create whiteboard: ${error.message}`);
    },
  });

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to log out.");
    } else {
      navigate("/login");
      toast.success("Logged out successfully.");
    }
  };

  return (
    <div className="min-h-screen bg-muted">
      <header className="flex items-center justify-between p-4 bg-card border-b">
        <h1 className="text-xl font-bold">My Whiteboards</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user?.email}</span>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>
      <main className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Your Rooms</h2>
          <Button onClick={() => createRoomMutation.mutate()} disabled={createRoomMutation.isPending}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {createRoomMutation.isPending ? "Creating..." : "New Whiteboard"}
          </Button>
        </div>
        {isLoading ? (
          <p>Loading your whiteboards...</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rooms?.map((room) => (
              <Link to={`/whiteboard/${room.id}`} key={room.id}>
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>{room.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {room.owner_id === user?.id ? "Owner" : "Member"}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;