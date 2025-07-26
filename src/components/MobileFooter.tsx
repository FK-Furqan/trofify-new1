import { Home, Search, Bell, MessageSquare, User, Bookmark, Settings, LogOut } from "lucide-react";
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
}

export const MobileFooter = ({
  activeTab,
  setActiveTab,
  setIsAuthenticated,
  userProfile,
  notificationCount = 0,
  messageCount = 0,
  onNotificationClick,
}: MobileFooterProps) => {
  // Main navigation items for mobile footer
  const footerNavItems = [
    { id: "home", icon: Home, label: "Home" },
    { id: "search", icon: Search, label: "Search" },
    { id: "notifications", icon: Bell, label: "Notifications" },
    { id: "messages", icon: MessageSquare, label: "Messages" },
    { id: "profile", icon: User, label: "Profile" },
  ];

  const handleNavClick = (tabId: string) => {
    console.log('Mobile footer nav click:', tabId);
    if (tabId === "profile" && userProfile) {
      console.log('Navigating to profile from mobile footer');
      setActiveTab("profile");
    } else {
      setActiveTab(tabId);
    }
  };

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
              {/* Show badge for notifications */}
              {item.id === "notifications" && notificationCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs h-4 w-4 p-0 flex items-center justify-center rounded-full">
                  {notificationCount}
                </Badge>
              )}
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