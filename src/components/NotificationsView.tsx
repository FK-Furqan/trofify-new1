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
  // Remove all fetching logic. Only render notifications using profiles.
  const handleProfileClick = (user: any) => {
    if (onProfileClick) {
      onProfileClick(user);
    }
  };
  const handleNotificationClick = (notification: any) => {
    if (notification.post_id && onNavigateToPost) {
      onNavigateToPost(notification.post_id);
    }
  };
  const getAvatarUrl = (avatar?: string) => {
    if (!avatar) return "/placeholder.svg";
    if (avatar.startsWith("http")) return avatar;
    return `https://trofify-media.s3.amazonaws.com/${avatar}`;
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
                  className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${isUnread ? 'bg-[#0e9591]/20' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={getAvatarUrl(actorProfile?.avatar)} />
                        <AvatarFallback>{actorProfile?.name?.[0] || "U"}</AvatarFallback>
                      </Avatar>
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
