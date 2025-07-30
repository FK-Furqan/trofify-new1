import { getBackendUrl } from './utils';

export interface Reel {
  id: string;
  video_url: string;
  thumbnail_url?: string;
  caption?: string;
  hashtags?: string[];
  audio_attribution?: string;
  location?: string;
  like_count: number;
  comment_count: number;
  is_liked: boolean;
  is_saved: boolean;
  view_count: number;
  created_at: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    user_type: string;
  };
}

export interface Comment {
  id: string;
  comment: string;
  created_at: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    user_type: string;
  };
  like_count: number;
  reply_count: number;
  is_liked?: boolean;
  replies?: Comment[];
}

export interface CreateReelData {
  userId: string;
  video: File;
  caption?: string;
  hashtags?: string;
  audioAttribution?: string;
  location?: string;
}

export class ReelService {
  private static baseUrl = getBackendUrl();

  // Upload a new reel
  static async uploadReel(data: CreateReelData): Promise<Reel> {
    const formData = new FormData();
    formData.append('video', data.video);
    formData.append('userId', data.userId);
    if (data.caption) formData.append('caption', data.caption);
    if (data.hashtags) formData.append('hashtags', data.hashtags);
    if (data.audioAttribution) formData.append('audioAttribution', data.audioAttribution);
    if (data.location) formData.append('location', data.location);

    const response = await fetch(`${this.baseUrl}/api/reels/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }

    return response.json();
  }

  // Get reels feed
  static async getReelsFeed(params: {
    limit?: number;
    offset?: number;
    userId?: string;
  }): Promise<Reel[]> {
    const searchParams = new URLSearchParams();
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.offset) searchParams.append('offset', params.offset.toString());
    if (params.userId) searchParams.append('userId', params.userId);

    const response = await fetch(`${this.baseUrl}/api/reels/feed?${searchParams}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch reels');
    }

    return response.json();
  }

  // Like/unlike a reel
  static async toggleLike(reelId: string, userId: string): Promise<{ liked: boolean }> {
    const response = await fetch(`${this.baseUrl}/api/reels/${reelId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to toggle like');
    }

    return response.json();
  }

  // Save/unsave a reel
  static async toggleSave(reelId: string, userId: string): Promise<{ saved: boolean }> {
    const response = await fetch(`${this.baseUrl}/api/reels/${reelId}/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to toggle save');
    }

    return response.json();
  }

  // Share a reel
  static async shareReel(reelId: string, userId: string, sharedTo?: string): Promise<{ shared: boolean }> {
    const response = await fetch(`${this.baseUrl}/api/reels/${reelId}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, sharedTo: sharedTo || 'general' }),
    });

    if (!response.ok) {
      throw new Error('Failed to share reel');
    }

    return response.json();
  }

  // Get reel comments
  static async getComments(reelId: string, params: {
    limit?: number;
    offset?: number;
  } = {}): Promise<Comment[]> {
    const searchParams = new URLSearchParams();
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.offset) searchParams.append('offset', params.offset.toString());

    const response = await fetch(`${this.baseUrl}/api/reels/${reelId}/comments?${searchParams}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch comments');
    }

    return response.json();
  }

  // Add comment to reel
  static async addComment(reelId: string, data: {
    userId: string;
    comment: string;
    parentCommentId?: string;
  }): Promise<Comment> {
    const response = await fetch(`${this.baseUrl}/api/reels/${reelId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to add comment');
    }

    return response.json();
  }

  // Like/unlike a comment
  static async toggleCommentLike(commentId: string, userId: string): Promise<{ liked: boolean }> {
    const response = await fetch(`${this.baseUrl}/api/reels/comments/${commentId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to toggle comment like');
    }

    return response.json();
  }

  // Record reel view
  static async recordView(reelId: string, userId: string, viewDuration?: number): Promise<{ viewed: boolean }> {
    const response = await fetch(`${this.baseUrl}/api/reels/${reelId}/view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, viewDuration: viewDuration || 0 }),
    });

    if (!response.ok) {
      throw new Error('Failed to record view');
    }

    return response.json();
  }

  // Get user's reels
  static async getUserReels(userId: string, params: {
    limit?: number;
    offset?: number;
  } = {}): Promise<Reel[]> {
    const searchParams = new URLSearchParams();
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.offset) searchParams.append('offset', params.offset.toString());

    const response = await fetch(`${this.baseUrl}/api/users/${userId}/reels?${searchParams}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch user reels');
    }

    return response.json();
  }

  // Get saved reels for a user
  static async getSavedReels(userId: string, params: {
    limit?: number;
    offset?: number;
  } = {}): Promise<Reel[]> {
    const searchParams = new URLSearchParams();
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.offset) searchParams.append('offset', params.offset.toString());

    const response = await fetch(`${this.baseUrl}/api/users/${userId}/saved-reels?${searchParams}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch saved reels');
    }

    return response.json();
  }

  // Validate video file
  static validateVideoFile(file: File): { isValid: boolean; error?: string } {
    const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/quicktime'];
    const maxSize = 100 * 1024 * 1024; // 100MB

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Invalid video format. Please upload MP4, MOV, AVI, or QuickTime files.'
      };
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'Video file too large. Maximum size is 100MB.'
      };
    }

    return { isValid: true };
  }

  // Format count for display
  static formatCount(count: number): string {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  }

  // Format time for display
  static formatTime(time: number): string {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // Format date for display
  static formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  }
} 