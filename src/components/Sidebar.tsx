
import { Home, Users, Calendar, Trophy, MapPin, Settings, Bookmark, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { getBackendUrl, getAvatarUrlWithCacheBust, clearUserSession } from "@/lib/utils";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userProfile?: any;
  setIsAuthenticated?: (auth: boolean) => void;
}

export const Sidebar = ({ activeTab, setActiveTab, userProfile, setIsAuthenticated }: SidebarProps) => {
  const [profileImageKey, setProfileImageKey] = useState(0);
  const [updateTimeout, setUpdateTimeout] = useState<NodeJS.Timeout | null>(null);

  // Listen for profile image updates
  useEffect(() => {
    const handleProfileImageUpdate = (event: CustomEvent) => {
      if (event.detail.userId === userProfile?.id) {
        // Clear any existing timeout
        if (updateTimeout) {
          clearTimeout(updateTimeout);
        }
        
        // Debounce the update to prevent flickering
        const newTimeout = setTimeout(() => {
          setProfileImageKey(prev => prev + 1);
        }, 100);
        
        setUpdateTimeout(newTimeout);
      }
    };

    window.addEventListener('profileImageUpdated', handleProfileImageUpdate as EventListener);
    
    return () => {
      window.removeEventListener('profileImageUpdated', handleProfileImageUpdate as EventListener);
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
    };
  }, [userProfile?.id, updateTimeout]);

  const menuItems = [
    { icon: Home, label: "Home", id: "home", active: activeTab === "home" },
    { icon: Users, label: "My Network", id: "network", count: 12 },
    { icon: Calendar, label: "Events", id: "events", count: 3 },
    { icon: Trophy, label: "Competitions", id: "competitions" },
    { icon: MapPin, label: "Venues Nearby", id: "venues" },
    { icon: Bookmark, label: "Saved Posts", id: "saved" },
    { icon: Settings, label: "Settings", id: "settings" },
  ];



  // Remove fallback dummy profile
  const profile = userProfile;

  // State for sport name
  const [sport, setSport] = useState(profile?.sport || "");

  useEffect(() => {
    // If sport is already present, no need to fetch
    if (profile?.sport) return;
    // Fetch sport from the appropriate table based on user_type
    const fetchSport = async () => {
      if (!profile?.id || !profile?.user_type) return;
      let table = "";
      switch (profile.user_type) {
        case "athlete": table = "athletes"; break;
        case "coach": table = "coaches"; break;
        case "fan": table = "fans"; break;
        case "venue": table = "venues"; break;
        case "sports_brand": table = "sports_brands"; break;
        default: return;
      }
      try {
        const res = await fetch(`/api/profile-sport?table=${table}&user_id=${profile.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.sport) setSport(data.sport);
        }
      } catch {}
    };
    fetchSport();
  }, [profile]);

  return (
    <div className="p-4 space-y-6">
      {/* User Profile */}
      <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
        <div className="flex flex-col items-center space-y-3">
          {profile && profile.avatar ? (
            <Avatar className="h-16 w-16">
              <AvatarImage 
                key={`sidebar-avatar-${profileImageKey}`}
                src={getAvatarUrlWithCacheBust(profile.avatar)} 
                onError={e => { e.currentTarget.src = "/placeholder.svg"; }} 
              />
              <AvatarFallback className="text-lg">{(profile.display_name || profile.email || "U")[0]}</AvatarFallback>
            </Avatar>
          ) : null}
          
          {/* User Name and Type */}
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-foreground text-lg">
              {profile?.display_name || profile?.name || profile?.email}
            </h3>
            
            {/* User Type Badge */}
            {profile?.user_type && (
              <Badge 
                variant="secondary" 
                className="text-xs font-medium px-3 py-1 bg-[#0e9591] text-white"
              >
                {profile.user_type.charAt(0).toUpperCase() + profile.user_type.slice(1)}
              </Badge>
            )}
            
            {/* Sport Badge */}
            {sport && (
              <Badge variant="secondary" className="text-xs mt-1 bg-[#0e9591] text-white px-3 py-1">
                {sport}
              </Badge>
            )}
          </div>
        </div>
        
        {/* Stats */}
        <div className="mt-4 flex justify-between text-sm border-t border-border pt-3">
          <div className="text-center">
            <div className="font-semibold text-foreground">1.2K</div>
            <div className="text-muted-foreground">Followers</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-foreground">856</div>
            <div className="text-muted-foreground">Following</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-foreground">43</div>
            <div className="text-muted-foreground">Posts</div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="bg-card border border-border rounded-lg shadow-sm">
        <div className="p-4">
          <h3 className="font-semibold text-foreground mb-3">Menu</h3>
          <div className="space-y-1">
            {menuItems.map((item, index) => (
              <Button
                key={index}
                variant={item.active ? "secondary" : "ghost"}
                className="w-full justify-start relative"
                size="sm"
                onClick={() => setActiveTab(item.id)}
              >
                <item.icon className="h-4 w-4 mr-3" />
                {item.label}
                {item.count && (
                  <Badge className="ml-auto bg-[#0e9591]/20 text-[#0e9591] text-xs">
                    {item.count}
                  </Badge>
                )}
              </Button>
            ))}
            
            {/* Logout Button */}
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
              size="sm"
              onClick={() => {
                if (setIsAuthenticated) {
                  setIsAuthenticated(false);
                }
              }}
            >
              <LogOut className="h-4 w-4 mr-3" />
              Logout
            </Button>
            

          </div>
        </div>
      </div>
    </div>
  );
};
