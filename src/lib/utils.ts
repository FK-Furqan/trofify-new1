import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Returns the backend URL, using VITE_BACKEND_URL if set, otherwise defaults to production backend
export const getBackendUrl = () => {
  return import.meta.env.VITE_BACKEND_URL || "https://trofify-backend.onrender.com";
};

// Utility function to get avatar URL with cache busting
export const getAvatarUrlWithCacheBust = (avatar?: string, forceRefresh: boolean = false) => {
  if (!avatar) return "/placeholder.svg";
  if (avatar.startsWith("http")) {
    // Only add cache busting if force refresh is requested
    if (forceRefresh) {
      const separator = avatar.includes('?') ? '&' : '?';
      return `${avatar}${separator}t=${Date.now()}`;
    }
    return avatar;
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
  
  // Only dispatch if more than 500ms have passed since last dispatch
  if (!lastDispatch || (now - parseInt(lastDispatch)) > 500) {
    const profileUpdateEvent = new CustomEvent('profileImageUpdated', {
      detail: { userId, newImageUrl }
    });
    window.dispatchEvent(profileUpdateEvent);
    console.log("Profile image update event dispatched:", profileUpdateEvent);
    
    // Store the timestamp of this dispatch
    sessionStorage.setItem(lastDispatchKey, now.toString());
  } else {
    console.log("Skipping profile update dispatch - too recent");
  }
};

// Utility function to handle profile image updates consistently
export const handleProfileImageUpdate = (userId: string, newImageUrl: string, refreshUserProfile?: () => void) => {
  // Dispatch the event for other components
  dispatchProfileImageUpdate(userId, newImageUrl);
  
  // Call refresh function if provided
  if (refreshUserProfile) {
    setTimeout(() => {
      refreshUserProfile();
    }, 1000);
  }
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
