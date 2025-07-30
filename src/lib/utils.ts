import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Returns the backend URL, using VITE_BACKEND_URL if set, otherwise defaults to production backend
export const getBackendUrl = () => {
  return import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
};

// Utility function to get avatar URL with cache busting
export const getAvatarUrlWithCacheBust = (avatar?: string, forceRefresh: boolean = false) => {
  if (!avatar) return "/placeholder.svg";
  if (avatar.startsWith("http")) {
    // Always add cache busting for profile images to ensure fresh images
    const separator = avatar.includes('?') ? '&' : '?';
    const timestamp = forceRefresh ? Date.now() : Math.floor(Date.now() / 30000); // Cache for 30 seconds unless forced
    return `${avatar}${separator}t=${timestamp}`;
  }
  // If not a full URL, fallback to placeholder (should not happen if backend is correct)
  return "/placeholder.svg";
};

// Utility function to dispatch profile image update event
export const dispatchProfileImageUpdate = (userId: string, newImageUrl: string) => {
  // Prevent multiple rapid dispatches by checking if an event was recently dispatched
  const lastDispatchKey = `lastProfileUpdate_${userId}`;
  const lastDispatch = sessionStorage.getItem(lastDispatchKey);
  const now = Date.now();
  
  // Only dispatch if more than 200ms have passed since last dispatch (reduced for faster updates)
  if (!lastDispatch || (now - parseInt(lastDispatch)) > 200) {
    const profileUpdateEvent = new CustomEvent('profileImageUpdated', {
      detail: { userId, newImageUrl, timestamp: now }
    });
    window.dispatchEvent(profileUpdateEvent);
    
    // Store the timestamp of this dispatch
    sessionStorage.setItem(lastDispatchKey, now.toString());
    
    // Also store the new image URL for immediate access
    sessionStorage.setItem(`profileImage_${userId}`, newImageUrl);
    
    // Force refresh all avatar images by updating a global flag
    sessionStorage.setItem('forceAvatarRefresh', now.toString());
  }
};

// Utility function to handle profile image updates consistently
export const handleProfileImageUpdate = (userId: string, newImageUrl: string, refreshUserProfile?: () => void) => {
  // Dispatch the event for other components
  dispatchProfileImageUpdate(userId, newImageUrl);
  
  // Call refresh function if provided (reduced delay for faster updates)
  if (refreshUserProfile) {
    setTimeout(() => {
      refreshUserProfile();
    }, 300);
  }
};

// Utility function to get the latest profile image URL
export const getLatestProfileImage = (userId: string, fallbackUrl?: string) => {
  const storedImage = sessionStorage.getItem(`profileImage_${userId}`);
  if (storedImage) {
    return getAvatarUrlWithCacheBust(storedImage, true);
  }
  return getAvatarUrlWithCacheBust(fallbackUrl, false);
};

// Utility function to check if avatar refresh is needed
export const shouldRefreshAvatar = () => {
  const forceRefresh = sessionStorage.getItem('forceAvatarRefresh');
  return !!forceRefresh;
};

// Unified timestamp formatting function
export const formatTimestamp = (dateString: string): string => {
  if (!dateString) return "";
  
  // Parse the date string and ensure it's treated as UTC
  let date: Date;
  try {
    // If the date string is already in ISO format, parse it directly
    if (dateString.includes('T') && dateString.includes('Z')) {
      date = new Date(dateString);
    } else {
      // If it's a database timestamp without timezone info, treat it as UTC
      date = new Date(dateString + 'Z');
    }
  } catch (error) {
    console.error('Error parsing date:', dateString, error);
    return "";
  }
  
  const now = new Date();
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.error('Invalid date:', dateString);
    return "";
  }
  
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  // Less than 1 minute
  if (diffSeconds < 60) {
    return "Just now";
  }
  
  // Less than 1 hour
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  }
  
  // Less than 24 hours
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }
  
  // More than 1 day - show date in "dd mmmm yyyy" format
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const year = date.getFullYear();
  
  return `${day} ${month} ${year}`;
};

// Simple session management for tab isolation only
export const clearUserSession = () => {
  sessionStorage.removeItem('userEmail');
  sessionStorage.removeItem('sessionId');
};

export const getUserSession = () => {
  const email = sessionStorage.getItem('userEmail');
  const sessionId = sessionStorage.getItem('sessionId');
  return { email, sessionId };
};

export const setUserSession = (email: string) => {
  const sessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  sessionStorage.setItem('userEmail', email);
  sessionStorage.setItem('sessionId', sessionId);
  return sessionId;
};

// Browser history utilities for proper back button handling
export const updateBrowserHistory = (tab: string) => {
  const newUrl = `/${tab}`;
  window.history.pushState({ tab }, '', newUrl);
};

export const handleBrowserBack = (tabHistory: string[], setActiveTab: (tab: string) => void, setTabHistory: (history: string[]) => void) => {
  if (tabHistory.length > 1) {
    const newHistory = [...tabHistory];
    newHistory.pop(); // Remove current tab
    const previousTab = newHistory[newHistory.length - 1];
    
    setTabHistory(newHistory);
    setActiveTab(previousTab);
    return true; // Successfully handled back navigation
  }
  return false; // No more history to go back to
};

// Session timeout management removed as requested

// Utility function to format text to proper case (first letter capital, rest lowercase)
export const toProperCase = (text: string): string => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};
