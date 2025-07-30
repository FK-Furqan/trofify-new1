import { Home, Search, Bell, MessageSquare, Plus, Bookmark, Settings, LogOut, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Notification } from "@/lib/notificationService";

interface MobileFooterProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setIsAuthenticated: (auth: boolean) => void;
  userProfile?: any;
  notificationCount?: number;
  messageCount?: number;
  onNotificationClick?: (notification: Notification) => void;
  hidden?: boolean; // New prop to hide the footer
}

export const MobileFooter = ({
  activeTab,
  setActiveTab,
  setIsAuthenticated,
  userProfile,
  notificationCount = 0,
  messageCount = 0,
  onNotificationClick,
  hidden = false, // Default to false
}: MobileFooterProps) => {
  // Main navigation items for mobile footer
  const footerNavItems = [
    { id: "home", icon: Home, label: "Home" },
    { id: "search", icon: Search, label: "Search" },
    { id: "reels", icon: Video, label: "Reels" },
    { id: "create-post", icon: Plus, label: "Post" },
    { id: "messages", icon: MessageSquare, label: "Messages" },
  ];

  const handleNavClick = (tabId: string) => {
    if (tabId === "profile" && userProfile) {
      setActiveTab("profile");
    } else if (tabId === "create-post") {
      setActiveTab("create-post");
    } else {
      setActiveTab(tabId);
    }
  };

  // Don't render if hidden
  if (hidden) {
    return null;
  }

  return (
    <footer className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
      <div className="flex items-center justify-around px-2 py-2">
        {footerNavItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            size="sm"
            onClick={() => handleNavClick(item.id)}
            className={`flex flex-col items-center justify-center h-14 w-full max-w-16 relative ${
              activeTab === item.id
                ? "text-[#0e9591] bg-[#0e9591]/10"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="relative">
              <item.icon className="h-5 w-5 mb-1" />
              {/* Show badge for messages */}
              {item.id === "messages" && messageCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs h-4 w-4 p-0 flex items-center justify-center rounded-full">
                  {messageCount > 99 ? "99+" : messageCount}
                </Badge>
              )}
            </div>
            <span className="text-xs font-medium">{item.label}</span>
          </Button>
        ))}
      </div>
    </footer>
  );
}; 