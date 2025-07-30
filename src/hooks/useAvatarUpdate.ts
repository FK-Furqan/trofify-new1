import { useState, useEffect } from 'react';
import { getLatestProfileImage, shouldRefreshAvatar } from '@/lib/utils';

export const useAvatarUpdate = (userId?: string, fallbackAvatar?: string) => {
  const [avatarRefreshTrigger, setAvatarRefreshTrigger] = useState(0);
  const [currentAvatar, setCurrentAvatar] = useState(fallbackAvatar);

  useEffect(() => {
    const handleProfileImageUpdate = (event: CustomEvent) => {
      if (event.detail.userId === userId) {
        // Force refresh of avatar display
        setAvatarRefreshTrigger(prev => prev + 1);
        setCurrentAvatar(event.detail.newImageUrl);
      }
    };

    window.addEventListener('profileImageUpdated', handleProfileImageUpdate as EventListener);
    
    return () => {
      window.removeEventListener('profileImageUpdated', handleProfileImageUpdate as EventListener);
    };
  }, [userId]);

  const getAvatarUrl = () => {
    if (!fallbackAvatar) return "/placeholder.svg";
    
    // Check if we should use the latest profile image
    if (userId && shouldRefreshAvatar()) {
      const latestImage = getLatestProfileImage(userId, fallbackAvatar);
      if (latestImage !== "/placeholder.svg") {
        return latestImage;
      }
    }
    
    return fallbackAvatar;
  };

  return {
    avatarUrl: getAvatarUrl(),
    refreshTrigger: avatarRefreshTrigger,
    currentAvatar
  };
}; 