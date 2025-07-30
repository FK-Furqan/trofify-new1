import { getBackendUrl } from './utils';

export interface Notification {
  id: number;
  user_id: string;
  actor_id: string;
  post_id: number | null;
  type: 'like' | 'comment' | 'support';
  message: string;
  is_read: boolean;
  created_at: string;
  actor?: {
    id: string;
    display_name: string;
    email: string;
    avatar: string;
    user_type: string;
    sport?: string;
  };
  post?: {
    id: number;
    description: string;
    images: any;
    media_url?: string;
    media_type?: string;
    created_at: string;
    user_id: string;
    author_name?: string;
    author_email?: string;
    avatar?: string;
    user_type?: string;
    category?: string;
  };
}

export class NotificationService {
  static async getNotifications(userId: string, limit: number = 30, offset: number = 0): Promise<Notification[]> {
    try {
      const response = await fetch(`${getBackendUrl()}/api/notifications/${userId}?limit=${limit}&offset=${offset}`);
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return await response.json();
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const response = await fetch(`${getBackendUrl()}/api/notifications/${userId}/unread-count`);
      if (!response.ok) throw new Error('Failed to fetch unread count');
      const data = await response.json();
      return data.count || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  static async markAsRead(notificationId: number): Promise<boolean> {
    try {
      const response = await fetch(`${getBackendUrl()}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const response = await fetch(`${getBackendUrl()}/api/notifications/${userId}/read-all`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  static async deleteNotification(notificationId: number): Promise<boolean> {
    try {
      const response = await fetch(`${getBackendUrl()}/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }
} 