
import { useState, useEffect } from "react";
import { Search, Bell, MessageSquare, User, Menu, Home, Users, Video, Calendar, Trophy, MapPin, Bookmark, Settings, X, Plus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { Notification } from "@/lib/notificationService";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { getBackendUrl, getAvatarUrlWithCacheBust } from "@/lib/utils";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setIsAuthenticated: (auth: boolean) => void;
  userProfile?: any;
  notificationCount?: number;
  messageCount?: number;
  onNotificationClick?: (notification: Notification) => void;
}

export const Header = ({ activeTab, setActiveTab, setIsAuthenticated, userProfile, notificationCount = 0, messageCount = 0, onNotificationClick }: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  // Update navItems for desktop navigation
  const navItems = [
    { id: "home", icon: Home, label: "Home" },
    { id: "search", icon: Search, label: "Search" },
    { id: "notifications", icon: Bell, label: "Notification" },
    { id: "messages", icon: MessageSquare, label: "Message" },
  ];

  const mobileNavItems = [
    { id: "home", icon: Home, label: "Home" },
    { id: "reels", icon: Video, label: "Reels" },
    { id: "network", icon: Users, label: "Network" },
    { id: "events", icon: Calendar, label: "Events" },
    { id: "competitions", icon: Trophy, label: "Competitions" },
    { id: "venues", icon: MapPin, label: "Venues" },
    { id: "saved", icon: Bookmark, label: "Saved" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  // Remove fallback dummy profile
  const profile = userProfile;

  return (
    <>
      <header className="bg-background border-b border-border fixed top-0 left-0 right-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <div 
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => setActiveTab("home")}
            >
              <img
                src="/Trofify Logo.png?v=2"
                alt="TrofiFy Logo"
                className="w-24 h-16 sm:w-40 sm:h-24 object-contain"
              />
            </div>

            {/* Desktop Navigation - now includes notification and message */}
            <div className="hidden lg:flex items-center space-x-2">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab(item.id)}
                  className="flex items-center space-x-2 relative"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {/* Show badge for notifications and messages */}
                  {item.id === "notifications" && notificationCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs h-4 w-4 p-0 flex items-center justify-center rounded-full">{notificationCount}</Badge>
                  )}
                  {item.id === "messages" && messageCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs h-4 w-4 p-0 flex items-center justify-center rounded-full">
                      {messageCount > 99 ? "99+" : messageCount}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>

            {/* Right Icons - Only keep profile, create, and menu icons here */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              {/* Mobile Search Icon */}
              <Button variant="ghost" size="sm" className="md:hidden p-2">
                <Search className="h-5 w-5" />
              </Button>
              {/* Dark Mode Toggle */}
              <DarkModeToggle className="hidden sm:flex" />
              {/* Create Post Button */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2"
                onClick={() => {
                  console.log('Desktop Create Post button clicked');
                  setActiveTab("create-post");
                }}
              >
                <Plus className="h-5 w-5" />
              </Button>
              {/* Create Story Button */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 text-orange-500"
                onClick={() => {
                  console.log('Desktop Create Story button clicked');
                  setActiveTab("create-story");
                }}
              >
                <Calendar className="h-5 w-5" />
              </Button>
              {/* Desktop Create Post Button */}
              <Button
                variant="outline"
                size="sm"
                className="hidden lg:inline-flex ml-2"
                onClick={() => {
                  console.log('Desktop Create Post text button clicked');
                  setActiveTab("create-post");
                }}
              >
                + Create Post
              </Button>
              {/* Profile Icon with image */}
              {profile && profile.avatar ? (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setActiveTab("profile")}
                  className="hidden sm:flex p-2"
                >
                  <span className="inline-block w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                                          <img
                        key={`header-avatar-${profileImageKey}`}
                        src={getAvatarUrlWithCacheBust(profile.avatar)}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={e => { e.currentTarget.src = "/placeholder.svg"; }}
                      />
                  </span>
                </Button>
              ) : null}
              {/* Logout Button - Desktop */}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  localStorage.removeItem('userEmail');
                  setIsAuthenticated(false);
                }}
                className="hidden lg:flex p-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="lg:hidden p-2"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-80 bg-background border-l border-border shadow-lg">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">Menu</h2>
              <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-4 space-y-2">
              {/* Dark Mode Toggle in Mobile Menu */}
              <div className="flex items-center justify-between p-2 border-b border-border mb-4">
                <span className="text-sm font-medium">Dark Mode</span>
                <DarkModeToggle />
              </div>
              {mobileNavItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                >
                  <item.icon className="h-4 w-4 mr-3" />
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
