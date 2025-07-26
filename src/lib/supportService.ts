import { getBackendUrl } from './utils';

export interface SupportCounts {
  supporter_count: number;
  supporting_count: number;
}

export interface SupportAction {
  action: 'supported' | 'un_supported';
  supported_user_supporter_count: number;  // Count for the user being supported/un-supported
  supporter_user_supporting_count: number;  // Count for the user doing the support/un-support
  notification_created?: boolean;
}

export class SupportService {
  // Toggle support/un-support for a user
  static async toggleSupport(supporterId: string, supportedId: string): Promise<SupportAction> {
    try {
      const response = await fetch(`${getBackendUrl()}/api/supports/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supporter_id: supporterId,
          supported_id: supportedId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Support service error:', error);
      throw error;
    }
  }

  // Get supporter count for a user
  static async getSupporterCount(userId: string): Promise<number> {
    try {
      const response = await fetch(`${getBackendUrl()}/api/supports/supporter-count/${userId}`);
      
      if (!response.ok) {
        console.error('Error getting supporter count:', response.status);
        return 0;
      }

      const data = await response.json();
      return data.count || 0;
    } catch (error) {
      console.error('Error getting supporter count:', error);
      return 0;
    }
  }

  // Get supporting count for a user
  static async getSupportingCount(userId: string): Promise<number> {
    try {
      const response = await fetch(`${getBackendUrl()}/api/supports/supporting-count/${userId}`);
      
      if (!response.ok) {
        console.error('Error getting supporting count:', response.status);
        return 0;
      }

      const data = await response.json();
      return data.count || 0;
    } catch (error) {
      console.error('Error getting supporting count:', error);
      return 0;
    }
  }

  // Check if current user is supporting another user
  static async isSupporting(supporterId: string, supportedId: string): Promise<boolean> {
    try {
      const response = await fetch(`${getBackendUrl()}/api/supports/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supporter_id: supporterId,
          supported_id: supportedId
        })
      });

      if (!response.ok) {
        console.error('Error checking support status:', response.status);
        return false;
      }

      const data = await response.json();
      return data.is_supporting || false;
    } catch (error) {
      console.error('Error checking support status:', error);
      return false;
    }
  }

  // Get support counts for a user
  static async getSupportCounts(userId: string): Promise<SupportCounts> {
    try {
      const response = await fetch(`${getBackendUrl()}/api/supports/counts/${userId}`);
      
      if (!response.ok) {
        console.error('Error getting support counts:', response.status);
        return {
          supporter_count: 0,
          supporting_count: 0
        };
      }

      const data = await response.json();
      return {
        supporter_count: data.supporter_count || 0,
        supporting_count: data.supporting_count || 0
      };
    } catch (error) {
      console.error('Error getting support counts:', error);
      return {
        supporter_count: 0,
        supporting_count: 0
      };
    }
  }

  // Subscribe to real-time support changes (using polling for now)
  static subscribeToSupportChanges(userId: string, callback: (payload: any) => void) {
    // For now, we'll use polling since we're not using direct Supabase
    // In the future, you could implement WebSocket support through your backend
    const interval = setInterval(async () => {
      try {
        const counts = await this.getSupportCounts(userId);
        callback({ type: 'counts_update', data: counts });
      } catch (error) {
        console.error('Error polling support changes:', error);
      }
    }, 5000); // Poll every 5 seconds

    // Return unsubscribe function
    return {
      unsubscribe: () => clearInterval(interval)
    };
  }
} 