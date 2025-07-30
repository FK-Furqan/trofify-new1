import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toProperCase } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, MessageSquare, Users, Heart, Users2 } from "lucide-react";
import { getBackendUrl, formatTimestamp } from "@/lib/utils";
import { useState, useEffect } from "react";

interface NetworkViewProps {
  onProfileClick?: (profile: any) => void;
  currentUserId?: string;
}

interface Connection {
  id: string;
  name: string;
  username: string;
  avatar: string;
  sport: string;
  user_type: string;
  supported_since: string;
  isConnected: boolean;
}

export const NetworkView = ({ onProfileClick, currentUserId }: NetworkViewProps) => {
  const [activeTab, setActiveTab] = useState("supports");
  const [supports, setSupports] = useState<Connection[]>([]);
  const [supporting, setSupporting] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [supportsCount, setSupportsCount] = useState(0);
  const [supportingCount, setSupportingCount] = useState(0);

  useEffect(() => {
    if (currentUserId) {
      fetchNetworkData();
    }
  }, [currentUserId, activeTab]);

  const fetchNetworkData = async () => {
    if (!currentUserId) return;

    setLoading(true);
    try {
      // Fetch support counts
      const countsResponse = await fetch(`${getBackendUrl()}/api/supports/counts/${currentUserId}`);
      if (countsResponse.ok) {
        const counts = await countsResponse.json();
        setSupportsCount(counts.supporter_count);
        setSupportingCount(counts.supporting_count);
      }

      // Fetch supporters
      const supportersResponse = await fetch(`${getBackendUrl()}/api/supports/supporters/${currentUserId}`);
      if (supportersResponse.ok) {
        const supportersData = await supportersResponse.json();
        setSupports(supportersData);
      }

      // Fetch supporting
      const supportingResponse = await fetch(`${getBackendUrl()}/api/supports/supporting/${currentUserId}`);
      if (supportingResponse.ok) {
        const supportingData = await supportingResponse.json();
        setSupporting(supportingData);
      }
    } catch (error) {
      console.error('Error fetching network data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileClick = async (connection: Connection) => {
    if (onProfileClick) {
      try {
        // Fetch complete user profile data from backend
        const response = await fetch(`${getBackendUrl()}/api/users/${connection.id}`);
        if (response.ok) {
          const completeProfile = await response.json();
  
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
            user_type: connection.user_type,
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
          user_type: connection.user_type,
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



  const renderConnectionCard = (connection: Connection) => (
    <div
      key={connection.id}
      className="border border-border rounded-lg p-3 md:p-4 text-center bg-background"
    >
      <Avatar
        className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-3 md:mb-4 cursor-pointer"
        onClick={() => handleProfileClick(connection)}
      >
        <AvatarImage src={connection.avatar} />
        <AvatarFallback>{connection.name[0]}</AvatarFallback>
      </Avatar>

      <h3
        className="font-semibold text-foreground mb-1 cursor-pointer hover:underline text-sm md:text-base truncate"
        onClick={() => handleProfileClick(connection)}
        title={connection.name}
      >
        {connection.name}
      </h3>
      <p
        className="text-xs md:text-sm text-muted-foreground mb-2 cursor-pointer hover:underline truncate"
        onClick={() => handleProfileClick(connection)}
        title={connection.username}
      >
        {connection.username}
      </p>
      <div className="flex items-center justify-center space-x-1 mb-2 md:mb-3">
        {connection.sport && (
          <Badge variant="secondary" className="text-xs bg-gray-600 text-white flex items-center justify-center">
            {toProperCase(connection.sport)}
          </Badge>
        )}
        <Badge variant="secondary" className="text-xs bg-[#0e9591] text-white flex items-center justify-center">
          {toProperCase(connection.user_type)}
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground mb-3 md:mb-4">
        Supporting since {formatTimestamp(connection.supported_since)}
      </p>

      <div className="flex space-x-1 md:space-x-2">
        {connection.isConnected ? (
          <Button variant="outline" size="sm" className="flex-1 text-xs">
            <MessageSquare className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            Message
          </Button>
        ) : (
          <Button size="sm" className="flex-1 text-xs">
            <UserPlus className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            Connect
          </Button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="w-full lg:max-w-4xl lg:mx-auto lg:p-4">
        <div className="bg-card rounded-none lg:rounded-lg shadow-sm p-6 border border-border">
          <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center">
            <Users className="h-6 w-6 mr-2 text-[#0e9591]" />
            My Network
          </h1>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0e9591]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full lg:max-w-4xl lg:mx-auto lg:p-4">
      <div className="bg-card rounded-none lg:rounded-lg shadow-sm p-6 border border-border">
        <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center">
          <Users className="h-6 w-6 mr-2 text-[#0e9591]" />
          My Network
        </h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex w-full mb-6 h-10 bg-transparent border-b border-border">
            <TabsTrigger 
              value="supports" 
              className="flex items-center justify-center gap-2 text-xs md:text-sm px-4 py-2 font-medium transition-all data-[state=active]:text-[#0e9591] data-[state=active]:border-b-2 data-[state=active]:border-[#0e9591] data-[state=inactive]:text-muted-foreground hover:text-[#0e9591] relative"
            >
              <Heart className="h-3 w-3 md:h-4 md:w-4" />
              Supports ({supportsCount})
            </TabsTrigger>
            <TabsTrigger 
              value="supporting" 
              className="flex items-center justify-center gap-2 text-xs md:text-sm px-4 py-2 font-medium transition-all data-[state=active]:text-[#0e9591] data-[state=active]:border-b-2 data-[state=active]:border-[#0e9591] data-[state=inactive]:text-muted-foreground hover:text-[#0e9591] relative"
            >
              <Users2 className="h-3 w-3 md:h-4 md:w-4" />
              Supporting ({supportingCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="supports" className="space-y-4">
            {supports.length === 0 ? (
              <div className="text-center py-8">
                <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No supporters yet</h3>
                <p className="text-muted-foreground">
                  When people start supporting you, they'll appear here.
                </p>
              </div>
                         ) : (
               <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-4">
                 {supports.map(renderConnectionCard)}
               </div>
             )}
          </TabsContent>

          <TabsContent value="supporting" className="space-y-4">
            {supporting.length === 0 ? (
              <div className="text-center py-8">
                <Users2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Not supporting anyone yet</h3>
                <p className="text-muted-foreground">
                  Start supporting people to see them here.
                </p>
              </div>
                         ) : (
               <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-4">
                 {supporting.map(renderConnectionCard)}
               </div>
             )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
