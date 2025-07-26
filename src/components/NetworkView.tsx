import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, MessageSquare, Users } from "lucide-react";
import { getBackendUrl } from "@/lib/utils";

interface NetworkViewProps {
  onProfileClick?: (profile: any) => void;
}

export const NetworkView = ({ onProfileClick }: NetworkViewProps) => {
  const connections = [
    {
      id: 1,
      name: "Sarah Johnson",
      username: "@sarahj_swimmer",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b977?w=100&h=100&fit=crop&crop=face",
      sport: "Swimming",
      mutualConnections: 12,
      isConnected: false,
    },
    {
      id: 2,
      name: "Mike Wilson",
      username: "@coach_mike_bb",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      sport: "Basketball Coach",
      mutualConnections: 8,
      isConnected: true,
    },
    {
      id: 3,
      name: "Emma Davis",
      username: "@emmad_yoga",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      sport: "Yoga Instructor",
      mutualConnections: 15,
      isConnected: false,
    },
  ];

  const handleProfileClick = async (connection: any) => {
    if (onProfileClick) {
      try {
        // Fetch complete user profile data from backend
        const response = await fetch(`${getBackendUrl()}/api/users/${connection.id}`);
        if (response.ok) {
          const completeProfile = await response.json();
          console.log("NetworkView: Complete profile fetched:", completeProfile);
          onProfileClick(completeProfile);
        } else {
          console.error('Failed to fetch complete profile, using fallback');
          // Fallback to basic profile data if fetch fails
          onProfileClick({
            id: connection.id,
            name: connection.name,
            display_name: connection.name,
            username: connection.username,
            avatar: connection.avatar,
            sport: connection.sport,
            user_type: connection.sport,
            verified: false,
            bio: `Professional ${connection.sport}`,
            coverImage: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&h=400&fit=crop",
            location: "New York, USA",
            joinDate: "March 2022",
            followers: Math.floor(Math.random() * 50000) + 10000,
            following: Math.floor(Math.random() * 1000) + 100,
            posts: Math.floor(Math.random() * 200) + 50,
          });
        }
      } catch (error) {
        console.error('Error fetching complete profile:', error);
        // Fallback to basic profile data if fetch fails
        onProfileClick({
          id: connection.id,
          name: connection.name,
          display_name: connection.name,
          username: connection.username,
          avatar: connection.avatar,
          sport: connection.sport,
          user_type: connection.sport,
          verified: false,
          bio: `Professional ${connection.sport}`,
          coverImage: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&h=400&fit=crop",
          location: "New York, USA",
          joinDate: "March 2022",
          followers: Math.floor(Math.random() * 50000) + 10000,
          following: Math.floor(Math.random() * 1000) + 100,
          posts: Math.floor(Math.random() * 200) + 50,
        });
      }
    }
  };

  return (
    <div className="w-full lg:max-w-4xl lg:mx-auto lg:p-4">
      <div className="bg-card rounded-none lg:rounded-lg shadow-sm p-6 border border-border">
        <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center">
                          <Users className="h-6 w-6 mr-2 text-[#0e9591]" />
          My Network
        </h1>

        <div className="grid grid-cols-2 gap-4">
          {connections.map((connection) => (
            <div
              key={connection.id}
              className="border border-border rounded-lg p-4 text-center bg-background"
            >
              <Avatar
                className="h-16 w-16 mx-auto mb-4 cursor-pointer"
                onClick={() => handleProfileClick(connection)}
              >
                <AvatarImage src={connection.avatar} />
                <AvatarFallback>{connection.name[0]}</AvatarFallback>
              </Avatar>

              <h3
                className="font-semibold text-foreground mb-1 cursor-pointer hover:underline"
                onClick={() => handleProfileClick(connection)}
              >
                {connection.name}
              </h3>
              <p
                className="text-sm text-muted-foreground mb-2 cursor-pointer hover:underline"
                onClick={() => handleProfileClick(connection)}
              >
                {connection.username}
              </p>
              <Badge variant="secondary" className="mb-3">
                {connection.sport}
              </Badge>

              <p className="text-xs text-muted-foreground mb-4">
                {connection.mutualConnections} mutual connections
              </p>

              <div className="flex space-x-2">
                {connection.isConnected ? (
                  <Button variant="outline" size="sm" className="flex-1">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                ) : (
                  <Button size="sm" className="flex-1">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Connect
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
