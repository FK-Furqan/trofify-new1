import { useState, useEffect } from "react";
import {
  Search,
  Bell,
  MessageSquare,
  Plus,
  Calendar,
  Home,
  User,
  Menu,
  Settings,
  Bookmark,
  Trophy,
  MapPin,
  Users,
  LogOut,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Notification } from "@/lib/notificationService";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { getBackendUrl, getAvatarUrlWithCacheBust, clearUserSession } from "@/lib/utils";

interface MobileHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setIsAuthenticated: (auth: boolean) => void;
  userProfile?: any;
  notificationCount?: number;
  messageCount?: number;
  onNotificationClick?: (notification: Notification) => void;
}

export const MobileHeader = ({
  activeTab,
  setActiveTab,
  setIsAuthenticated,
  userProfile,
  notificationCount = 0,
  messageCount = 0,
  onNotificationClick,
}: MobileHeaderProps) => {
  const [showSidebar, setShowSidebar] = useState(false);
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

  // Prevent background scroll when sidebar is open
  useEffect(() => {
    if (showSidebar) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showSidebar]);

  // Navigation icons moved to footer - keeping only essential header elements

  const sidebarMenuItems = [
    {
      id: "profile",
      icon: User,
      label: "Profile",
      description: "View your profile",
    },

    {
      id: "saved",
      icon: Bookmark,
      label: "Saved",
      description: "Your saved posts",
    },
    {
      id: "competitions",
      icon: Trophy,
      label: "Competitions",
      description: "Join competitions",
    },
    { id: "venues", icon: MapPin, label: "Venues", description: "Find venues" },
    {
      id: "network",
      icon: Users,
      label: "Network",
      description: "Your connections",
    },

    {
      id: "settings",
      icon: Settings,
      label: "Settings & Privacy",
      description: "Manage your account",
    },
  ];

  const handleProfileClick = () => {
    console.log('Mobile header profile clicked');
    if (userProfile) {
      setActiveTab("profile");
    } else {
      console.error('No user profile available for mobile header profile click');
    }
  };

  const handleMenuItemClick = (itemId: string) => {
    setActiveTab(itemId);
    setShowSidebar(false);
  };

  // Remove fallback dummy profile
  const profile = userProfile;

  return (
    <>
      {/* Mobile Header */}
      <header className="bg-background border-b border-border fixed top-0 left-0 right-0 z-50 shadow-sm">
        {/* First Row - Hamburger Menu + Logo + Right Icons */}
        <div className="flex items-center h-12 px-4">
          {/* Left Side - Hamburger Menu + Logo */}
          <div className="flex items-center space-x-2">
            {/* Hamburger Menu */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSidebar(true)}
              className="p-2"
            >
              <Menu className="h-6 w-6" />
            </Button>

            {/* Logo */}
            <div 
              className="flex items-center space-x-1 cursor-pointer"
              onClick={() => setActiveTab("home")}
            >
              <img
                src="/Trofify Logo.png?v=2"
                alt="TrofiFy Logo"
                className="w-22 h-8 object-contain"
              />
            </div>
          </div>

          {/* Right Side Icons - Plus and profile avatar here */}
          <div className="flex items-center space-x-1 ml-auto">
            {/* Create Post Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 hover:bg-muted"
              onClick={() => {
                console.log('Create Post button clicked');
                setActiveTab("create-post");
              }}
            >
              <Plus className="h-5 w-5" />
            </Button>
            {/* Create Story Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 text-orange-500 hover:bg-muted"
              onClick={() => {
                console.log('Create Story button clicked');
                setActiveTab("create-story");
              }}
            >
              <Calendar className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleProfileClick}
              className="p-1"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage
                  key={`mobile-avatar-${profileImageKey}`}
                  src={getAvatarUrlWithCacheBust(profile?.avatar)}
                  alt="Profile"
                  onError={e => { e.currentTarget.src = "/placeholder.svg"; }}
                />
                <AvatarFallback>
                  {profile?.name?.[0] || <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
            </Button>
          </div>
        </div>


      </header>

      {/* Sidebar Overlay */}
      {showSidebar && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setShowSidebar(false)}
          />

          {/* Sidebar */}
          <div className="fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white dark:bg-gray-900 shadow-xl border-r border-border overflow-hidden flex flex-col">
            {/* Profile Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Profile</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSidebar(false)}
                  className="p-1"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* User Info */}
              <div className="flex flex-col items-center space-y-3">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    key={`mobile-sidebar-avatar-${profileImageKey}`}
                    src={getAvatarUrlWithCacheBust(profile?.avatar)}
                    alt="Profile"
                    onError={e => { e.currentTarget.src = "/placeholder.svg"; }}
                  />
                  <AvatarFallback className="text-lg">
                    {(profile?.display_name || profile?.name || profile?.email || "U")[0]}
                  </AvatarFallback>
                </Avatar>
                
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
                  
                  {/* Sport Badge - if available */}
                  {profile?.sport && (
                    <Badge variant="secondary" className="text-xs bg-[#0e9591] text-white px-3 py-1">
                      {profile.sport}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Menu Options - Scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 scrollbar-hide">
              <h3 className="font-semibold text-gray-900 mb-3">Menu</h3>
              <div className="space-y-1">
                {[
                  { icon: Home, label: "Home", id: "home", active: activeTab === "home" },
                  { icon: Users, label: "My Network", id: "network", count: 12 },
                  { icon: Calendar, label: "Events", id: "events", count: 3 },
                  { icon: Trophy, label: "Competitions", id: "competitions" },
                  { icon: MapPin, label: "Venues Nearby", id: "venues" },
                  { icon: Bookmark, label: "Saved Posts", id: "saved" },
                  { icon: Settings, label: "Settings", id: "settings" },
                ].map((item, index) => (
                  <Button
                    key={index}
                    variant={item.active ? "secondary" : "ghost"}
                    className="w-full justify-start relative"
                    size="sm"
                    onClick={() => { setActiveTab(item.id); setShowSidebar(false); }}
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
                    setShowSidebar(false);
                    setIsAuthenticated(false);
                  }}
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Logout
                </Button>
                

              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
