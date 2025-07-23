
import { Home, Users, Calendar, Trophy, MapPin, Settings, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userProfile?: any;
}

export const Sidebar = ({ activeTab, setActiveTab, userProfile }: SidebarProps) => {
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
  const getAvatarUrl = (avatar?: string) => {
    if (!avatar) return "/placeholder.svg";
    if (avatar.startsWith("http")) return avatar;
    return `https://trofify-media.s3.amazonaws.com/${avatar}`;
  };

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
        <div className="flex flex-col items-center md:flex-row md:items-center md:space-x-3">
          {profile && profile.avatar ? (
            <Avatar className="h-12 w-12">
              <AvatarImage src={getAvatarUrl(profile.avatar)} onError={e => { e.currentTarget.src = "/placeholder.svg"; }} />
              <AvatarFallback>{(profile.display_name || profile.email || "U")[0]}</AvatarFallback>
            </Avatar>
          ) : null}
          <div className="mt-2 md:mt-0 text-center md:text-left">
            <h3 className="font-semibold text-foreground">{profile?.display_name || profile?.email}</h3>
            {sport && (
              <Badge variant="secondary" className="text-xs mt-1 bg-[#0e9591] text-white">{sport}</Badge>
            )}
          </div>
        </div>
        <div className="mt-3 flex justify-between text-sm">
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
                  <Badge className="ml-auto bg-blue-100 text-blue-800 text-xs dark:bg-blue-900 dark:text-blue-200">
                    {item.count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
