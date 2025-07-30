import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Heart,
  MessageCircle,
  UserPlus,
  Calendar,
  Trophy,
  MapPin,
  User,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";
import { getBackendUrl } from "@/lib/utils";

interface NotificationsViewProps {
  onProfileClick?: (profile: any) => void;
  userId?: string;
  notifications: any[];
  profiles: Record<string, any>;
  setNotifications: (n: any[]) => void;
  onNavigateToPost?: (postId: string) => void;
}

export const NotificationsView = ({
  onProfileClick,
  userId,
  notifications = [],
  profiles = {},
  setNotifications,
  onNavigateToPost,
}: NotificationsViewProps) => {
  const [loadingProfile, setLoadingProfile] = useState<string | null>(null);
  // Remove all fetching logic. Only render notifications using profiles.
  const handleProfileClick = (user: any) => {
    if (onProfileClick) {
      onProfileClick(user);
    }
  };
    const handleNotificationClick = async (notification: any) => {
    
    // Mark notification as read if it's unread
    if (notification.is_read === false) {
      try {
        await fetch(`${getBackendUrl()}/api/notifications/${notification.id}/read`, {
          method: 'PUT'
        });
        
        // Update local state to mark as read
        const updatedNotifications = notifications.map(n => 
          n.id === notification.id ? { ...n, is_read: true } : n
        );
        setNotifications(updatedNotifications);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
    
    // Handle post notifications
    if (notification.post_id && onNavigateToPost) {
      onNavigateToPost(notification.post_id);
      return;
    }
    
    // Handle support notifications - navigate to supporter's profile
    if (notification.type === 'support' && notification.actor_id && onProfileClick) {
      setLoadingProfile(notification.actor_id);
      try {
        // Fetch the supporter's complete profile data
        const response = await fetch(`${getBackendUrl()}/api/users/${notification.actor_id}`);
        if (response.ok) {
          const supporterProfile = await response.json();
          onProfileClick(supporterProfile);
        } else {
          console.error('Failed to fetch supporter profile, using fallback');
          // Fallback to basic profile data if fetch fails
          const fallbackProfile = {
            id: notification.actor_id,
            display_name: notification.message?.split(' has started supporting you')[0] || 'User',
            email: `${notification.actor_id}@example.com`,
            avatar: null,
            user_type: 'athlete',
            sport: 'athlete'
          };
          onProfileClick(fallbackProfile);
        }
      } catch (error) {
        console.error('Error fetching supporter profile:', error);
        // Fallback to basic profile data if fetch fails
        const fallbackProfile = {
          id: notification.actor_id,
          display_name: notification.message?.split(' has started supporting you')[0] || 'User',
          email: `${notification.actor_id}@example.com`,
          avatar: null,
          user_type: 'athlete',
          sport: 'athlete'
        };
        onProfileClick(fallbackProfile);
      } finally {
        setLoadingProfile(null);
      }
    }
  };
  const getAvatarUrl = (avatar?: string) => {
    if (!avatar) return "/placeholder.svg";
    if (avatar.startsWith("http")) return avatar;
    return "/placeholder.svg";
  };
  return (
    <div className="w-full lg:max-w-2xl lg:mx-auto lg:p-4 flex flex-col h-[calc(100vh-6rem)] max-h-[700px]">
      <div className="bg-card rounded-none lg:rounded-lg shadow-sm flex flex-col h-full">
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-bold text-foreground">Notifications</h1>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No notifications yet.</div>
          ) : (
            notifications.map((notification, index) => {
              const actorProfile = profiles[notification.actor_id];
              const isUnread = notification.is_read === false;
              let message = notification.message;
              if (notification.type === 'like') {
                message = `${actorProfile?.name || 'Someone'} liked your photo`;
              } else if (notification.type === 'comment') {
                message = `${actorProfile?.name || 'Someone'} commented: ${notification.comment || notification.message}`;
              }
              return (
                <div
                  key={index}
                  className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                    isUnread ? 'bg-[#0e9591]/20' : ''
                  } ${notification.type === 'support' ? 'border-l-4 border-l-[#0e9591]' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={getAvatarUrl(actorProfile?.avatar)} />
                        <AvatarFallback>{actorProfile?.name?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                      {/* Add icon for support notifications */}
                      {notification.type === 'support' && (
                        <div className="absolute -bottom-1 -right-1 bg-[#0e9591] rounded-full p-1 shadow-sm">
                          <User className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span
                          className="font-medium text-foreground cursor-pointer hover:underline truncate"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProfileClick(actorProfile);
                          }}
                        >
                          {actorProfile?.name || notification.actor_id}
                        </span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {notification.created_at ? new Date(notification.created_at).toLocaleTimeString() : ""}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {message}
                        {notification.type === 'support' && (
                          <span className="text-[#0e9591] text-xs ml-2">
                            {loadingProfile === notification.actor_id ? 'Loading...' : 'Click to view profile →'}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
