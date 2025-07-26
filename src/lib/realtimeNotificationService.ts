import { getSocket } from './socket';
import { NotificationService, Notification } from './notificationService';

export class RealtimeNotificationService {
  private static listeners: Map<string, (notification: Notification) => void> = new Map();
  private static unreadCountListeners: Map<string, (count: number) => void> = new Map();
  private static isInitialized = false;

  static initialize(userId: string) {
    if (this.isInitialized) return;

    const socket = getSocket();
    
    // Listen for new notifications
    socket.on('new_notification', (notification: Notification) => {
      console.log('Received new notification:', notification);
      
      // Notify all listeners
      this.listeners.forEach((callback) => {
        callback(notification);
      });
    });

    // Listen for unread count updates
    socket.on('unread_count_update', (data: { userId: string; count: number }) => {
      if (data.userId === userId) {
        this.unreadCountListeners.forEach((callback) => {
          callback(data.count);
        });
      }
    });

    // Join user's notification room
    socket.emit('join_notifications', { userId });

    this.isInitialized = true;
  }

  static subscribeToNotifications(callback: (notification: Notification) => void): () => void {
    const id = Math.random().toString(36).substr(2, 9);
    this.listeners.set(id, callback);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(id);
    };
  }

  static subscribeToUnreadCount(callback: (count: number) => void): () => void {
    const id = Math.random().toString(36).substr(2, 9);
    this.unreadCountListeners.set(id, callback);

    // Return unsubscribe function
    return () => {
      this.unreadCountListeners.delete(id);
    };
  }

  static requestUnreadCount(userId: string) {
    const socket = getSocket();
    socket.emit('get_unread_count', { userId });
  }

  static markAsRead(notificationId: number) {
    const socket = getSocket();
    socket.emit('mark_notification_read', { notificationId });
  }

  static markAllAsRead(userId: string) {
    const socket = getSocket();
    socket.emit('mark_all_notifications_read', { userId });
  }

  static cleanup() {
    const socket = getSocket();
    socket.off('new_notification');
    socket.off('unread_count_update');
    this.listeners.clear();
    this.unreadCountListeners.clear();
    this.isInitialized = false;
  }
} 