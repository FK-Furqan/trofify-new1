import { getBackendUrl } from './utils';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    id: string;
    display_name: string;
    email: string;
    avatar: string;
    user_type: string;
  };
  receiver?: {
    id: string;
    display_name: string;
    email: string;
    avatar: string;
    user_type: string;
  };
}

export interface Conversation {
  id: string;
  other_user: {
    id: string;
    display_name: string;
    email: string;
    avatar: string;
    user_type: string;
  };
  created_at: string;
  updated_at: string;
  last_message_at: string;
  last_message?: string;
  unread_count?: number;
}

export interface TypingStatus {
  id: string;
  conversation_id: string;
  user_id: string;
  is_typing: boolean;
  last_typing_at: string;
}

class MessagingService {
  private baseUrl = getBackendUrl();

  // Get or create conversation between two users
  async getOrCreateConversation(user1Id: string, user2Id: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user1_id: user1Id, user2_id: user2Id }),
      });

      if (!response.ok) {
        throw new Error('Failed to get or create conversation');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting/creating conversation:', error);
      throw error;
    }
  }

  // Get user's conversations
  async getUserConversations(userId: string): Promise<Conversation[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/${userId}/conversations`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  // Get messages for a conversation
  async getConversationMessages(conversationId: string, page: number = 1, limit: number = 50): Promise<Message[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/conversations/${conversationId}/messages?page=${page}&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  // Send a message
  async sendMessage(conversationId: string, senderId: string, receiverId: string, content: string): Promise<Message> {
    try {
      const response = await fetch(`${this.baseUrl}/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender_id: senderId,
          receiver_id: receiverId,
          content: content.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Mark messages as read
  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/conversations/${conversationId}/messages/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark messages as read');
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  // Get unread message count
  async getUnreadMessageCount(userId: string): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/${userId}/unread-messages`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch unread message count');
      }

      const data = await response.json();
      return data.count || 0;
    } catch (error) {
      console.error('Error fetching unread message count:', error);
      return 0;
    }
  }

  // Update typing status
  async updateTypingStatus(conversationId: string, userId: string, isTyping: boolean): Promise<TypingStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/api/conversations/${conversationId}/typing`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          is_typing: isTyping,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update typing status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating typing status:', error);
      throw error;
    }
  }

  // Get typing status for a conversation
  async getTypingStatus(conversationId: string): Promise<TypingStatus[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/conversations/${conversationId}/typing`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch typing status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching typing status:', error);
      return [];
    }
  }
}

export const messagingService = new MessagingService(); 