import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Check, Trash2, Heart, MessageCircle, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toProperCase } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationService, Notification } from "@/lib/notificationService";
import { RealtimeNotificationService } from "@/lib/realtimeNotificationService";
import { toast } from "@/components/ui/use-toast";
import { getBackendUrl, formatTimestamp } from "@/lib/utils";

interface NotificationsPageProps {
  userId: string;
  onBack: () => void;
  onNotificationClick?: (notification: Notification) => void;
  onProfileClick?: (profile: any) => void;
}

export const NotificationsPage = ({ userId, onBack, onNotificationClick, onProfileClick }: NotificationsPageProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeNotification = useRef<(() => void) | null>(null);
  const unsubscribeUnreadCount = useRef<(() => void) | null>(null);
  const limit = 20;

  const fetchNotifications = async (reset = false) => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const currentOffset = reset ? 0 : offset;
      const [notificationsData, unreadCountData] = await Promise.all([
        NotificationService.getNotifications(userId, limit, currentOffset),
        NotificationService.getUnreadCount(userId)
      ]);
      
      if (reset) {
        setNotifications(notificationsData);
        setOffset(limit);
      } else {
        setNotifications(prev => [...prev, ...notificationsData]);
        setOffset(prev => prev + limit);
      }
      
      setUnreadCount(unreadCountData);
      setHasMore(notificationsData.length === limit);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    
    // Mark as read if not already read
    if (!notification.is_read) {
      // Use real-time service for immediate feedback
      RealtimeNotificationService.markAsRead(notification.id);
      
      // Also call the REST API as backup
      const success = await NotificationService.markAsRead(notification.id);
      if (success) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notification.id ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }

    // Handle support notifications - navigate to supporter's profile
    if (notification.type === 'support' && notification.actor_id && onProfileClick) {
      try {
        // Fetch the supporter's complete profile data
        const response = await fetch(`${getBackendUrl()}/api/users/${notification.actor_id}`);
        if (response.ok) {
          const supporterProfile = await response.json();
          onProfileClick(supporterProfile);
          return; // Don't call onNotificationClick for support notifications
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
          return; // Don't call onNotificationClick for support notifications
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
        return; // Don't call onNotificationClick for support notifications
      }
    }

    // Call the parent handler for other notification types
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  const handleMarkAllAsRead = async () => {
    // Use real-time service for immediate feedback
    RealtimeNotificationService.markAllAsRead(userId);
    
    // Also call the REST API as backup
    const success = await NotificationService.markAllAsRead(userId);
    if (success) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      });
    }
  };

  const handleDeleteNotification = async (notificationId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const success = await NotificationService.deleteNotification(notificationId);
    if (success) {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (!notifications.find(n => n.id === notificationId)?.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      toast({
        title: "Success",
        description: "Notification deleted",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
    }
  };

  const getAvatarUrl = (avatar?: string) => {
    if (!avatar) return "/placeholder.svg";
    if (avatar.startsWith("http")) return avatar;
    return "/placeholder.svg";
  };



  const getNotificationIcon = (type: string) => {
    switch (type) {
          case 'like':
      return <Heart className="h-5 w-5 text-[#0e9591]" />;
          case 'comment':
      return <MessageCircle className="h-5 w-5 text-[#0e9591]" />;
      case 'support':
        return <Heart className="h-5 w-5 text-[#0e9591]" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  // Set up real-time notifications and polling as fallback
  useEffect(() => {
    if (userId) {
      // Initialize real-time notification service
      RealtimeNotificationService.initialize(userId);
      
      // Subscribe to new notifications
      unsubscribeNotification.current = RealtimeNotificationService.subscribeToNotifications((newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show toast for new notification
        toast({
          title: "New Notification",
          description: newNotification.message,
        });
      });

      // Subscribe to unread count updates
      unsubscribeUnreadCount.current = RealtimeNotificationService.subscribeToUnreadCount((count) => {
        setUnreadCount(count);
      });

      // Initial fetch
      fetchNotifications(true);
      
      // Request initial unread count
      RealtimeNotificationService.requestUnreadCount(userId);
      
      // Poll every 60 seconds as fallback (reduced frequency since we have real-time)
      pollingInterval.current = setInterval(() => {
        fetchNotifications(true);
      }, 60000);

      return () => {
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current);
        }
        if (unsubscribeNotification.current) {
          unsubscribeNotification.current();
        }
        if (unsubscribeUnreadCount.current) {
          unsubscribeUnreadCount.current();
        }
      };
    }
  }, [userId]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-sm"
            >
              <Check className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-2xl mx-auto p-4">
        {loading && notifications.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">Loading notifications...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              No notifications yet
            </h3>
            <p className="text-muted-foreground">
              When you receive likes or comments, they'll appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                  !notification.is_read ? 'bg-muted/30 border-primary/20' : 'bg-card'
                } ${notification.type === 'support' ? 'border-l-4 border-l-[#0e9591]' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start space-x-3">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={getAvatarUrl(notification.actor?.avatar)} />
                    <AvatarFallback>
                      {notification.actor?.display_name?.[0] || notification.actor?.email?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {getNotificationIcon(notification.type)}
                      <span className="font-medium text-sm">
                        {notification.actor?.display_name || notification.actor?.email}
                      </span>
                      <div className="flex items-center space-x-1">
                        {notification.actor?.sport && (
                          <Badge variant="secondary" className="text-xs bg-gray-600 text-white flex items-center justify-center">
                            {toProperCase(notification.actor.sport)}
                          </Badge>
                        )}
                        {notification.actor?.user_type && (
                          <Badge variant="secondary" className="text-xs bg-[#0e9591] text-white flex items-center justify-center">
                            {toProperCase(notification.actor.user_type)}
                          </Badge>
                        )}
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {notification.message}
                      {notification.type === 'support' && (
                        <span className="text-[#0e9591] text-xs ml-2">Click to view profile →</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimestamp(notification.created_at)}
                    </p>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDeleteNotification(notification.id, e)}
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {/* Load More Button */}
            {hasMore && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => fetchNotifications(false)}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 