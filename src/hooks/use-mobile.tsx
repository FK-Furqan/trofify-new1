import { useState, useEffect } from 'react';
import { getBackendUrl } from '@/lib/utils';

export const useMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

// Custom hook for real-time message updates
export const useRealTimeMessages = (currentUserId?: string, isActive: boolean = true) => {
  const [messageCount, setMessageCount] = useState(0);

  const fetchMessageCount = async () => {
    if (!currentUserId) return;
    
    try {
      const response = await fetch(`${getBackendUrl()}/api/users/${currentUserId}/unread-messages`);
      if (response.ok) {
        const data = await response.json();
        setMessageCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching message count:', error);
    }
  };

  useEffect(() => {
    if (!currentUserId || !isActive) return;

    // Initial fetch
    fetchMessageCount();

    // Set up polling
    const interval = setInterval(() => {
      fetchMessageCount();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [currentUserId, isActive]);

  return { messageCount, refreshMessageCount: fetchMessageCount };
};
