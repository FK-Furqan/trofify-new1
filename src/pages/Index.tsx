import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileFooter } from "@/components/MobileFooter";
import { Sidebar } from "@/components/Sidebar";
import { Feed } from "@/components/Feed";
import { RightPanel } from "@/components/RightPanel";
import { StoriesBar } from "@/components/StoriesBar";
import { ReelsView } from "@/components/ReelsView";
import { MessagesView } from "@/components/MessagesView";
import { ProfileView } from "@/components/ProfileView";
import { NetworkView } from "@/components/NetworkView";
import { EventsView } from "@/components/EventsView";
import { CompetitionsView } from "@/components/CompetitionsView";
import { VenuesView } from "@/components/VenuesView";
import { SavedPostsView } from "@/components/SavedPostsView";
import { SettingsView } from "@/components/SettingsView";
import { AuthSystem } from "@/components/AuthSystem";
import { CreatePost } from "@/components/CreatePost";
import { CreateStory } from "@/components/CreateStory";
import { SearchView } from "@/components/SearchView";
import { Header } from "@/components/Header";
import { getSocket } from "@/lib/socket";
import { getBackendUrl, getUserSession, setUserSession, updateBrowserHistory, handleBrowserBack } from "@/lib/utils";
import { PostDetailView } from "@/components/PostDetailView";
import { Notification } from "@/lib/notificationService";
import { NotificationsPage } from "@/components/NotificationsPage";
import { useRealTimeMessages } from "@/hooks/use-mobile";
import { useToast } from "@/components/ui/use-toast";


const Index = () => {
  // All hooks must be at the top - no conditional hooks
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [storiesRefreshTrigger, setStoriesRefreshTrigger] = useState(0);
  const [profileUpdateTrigger, setProfileUpdateTrigger] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [viewingPost, setViewingPost] = useState<any | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [tabHistory, setTabHistory] = useState<string[]>(["home"]);

  // React Router hooks
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Use real-time message hook
  const { messageCount, refreshMessageCount } = useRealTimeMessages(
    userProfile?.id, 
    activeTab === 'messages' || activeTab === 'home'
  );

  // All callbacks and memoized values
  const handleAuthSuccess = useCallback((email?: string) => {
    setIsAuthenticated(true);
    if (email) {
      setUserEmail(email);
      setUserSession(email);
    }
    setIsInitialized(true);
  }, []);

  const handleTabChange = useCallback((newTab: string) => {
    if (newTab !== activeTab) {
      setSelectedProfile(null);
      setActiveTab(newTab);
      
      // Update tab history for back button functionality
      setTabHistory(prev => {
        const newHistory = [...prev, newTab];
        // Keep only last 10 tabs to prevent memory issues
        return newHistory.slice(-10);
      });
      
      // Update URL to match the tab
      const tabToUrlMap: Record<string, string> = {
        'home': '/home',
        'messages': '/messages',
        'profile': '/profile',
        'network': '/network',
        'events': '/events',
        'competitions': '/competitions',
        'venues': '/venues',
        'saved': '/saved',
        'settings': '/settings',
        'search': '/search',
        'reels': '/reels',
        'notifications': '/notifications'
      };
      
      const newUrl = tabToUrlMap[newTab] || '/home';
      navigate(newUrl, { replace: false });
    }
  }, [activeTab, navigate]);



  // Handle browser back button and navigation
  useEffect(() => {
    // Parse URL on initial load to set correct active tab
    const pathname = location.pathname;
    const urlTab = pathname.substring(1) || 'home'; // Remove leading slash
    
    // Map URL paths to tab names
    const urlToTabMap: Record<string, string> = {
      '': 'home',
      'home': 'home',
      'feed': 'home',
      'messages': 'messages',
      'profile': 'profile',
      'network': 'network',
      'events': 'events',
      'competitions': 'competitions',
      'venues': 'venues',
      'saved': 'saved',
      'settings': 'settings',
      'search': 'search',
      'reels': 'reels',
      'notifications': 'notifications'
    };
    
    const tabFromUrl = urlToTabMap[urlTab] || 'home';
    
    // Only update if different from current tab
    if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
      setTabHistory(prev => {
        const newHistory = [...prev, tabFromUrl];
        return newHistory.slice(-10);
      });
    }
  }, [location.pathname, activeTab]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Get the tab from the URL
      const pathname = window.location.pathname;
      const urlTab = pathname.substring(1) || 'home';
      
      const urlToTabMap: Record<string, string> = {
        '': 'home',
        'home': 'home',
        'feed': 'home',
        'messages': 'messages',
        'profile': 'profile',
        'network': 'network',
        'events': 'events',
        'competitions': 'competitions',
        'venues': 'venues',
        'saved': 'saved',
        'settings': 'settings',
        'search': 'search',
        'reels': 'reels',
        'notifications': 'notifications'
      };
      
      const newTab = urlToTabMap[urlTab] || 'home';
      
      if (newTab !== activeTab) {
        setActiveTab(newTab);
        setSelectedProfile(null);
        
        // Update tab history
        setTabHistory(prev => {
          const newHistory = [...prev, newTab];
          return newHistory.slice(-10);
        });
      }
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Optional: Show confirmation dialog when user tries to close tab
      // event.preventDefault();
      // event.returnValue = '';
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [activeTab]);

  // Session timeout management removed as requested



  const refreshUserProfile = useCallback(async () => {
    if (!userEmail || profileLoading) {
      console.log('refreshUserProfile: skipping because', { userEmail, profileLoading });
      return;
    }
    
    console.log('refreshUserProfile: starting for email:', userEmail);
    setProfileLoading(true);
    try {
      const res = await fetch(`${getBackendUrl()}/signup/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });
      
      console.log('refreshUserProfile: response status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('refreshUserProfile: success, data:', data);
        setUserProfile(data);
        setProfileUpdateTrigger(prev => prev + 1); // Trigger re-render of all profile-dependent components
      } else {
        console.error('refreshUserProfile: failed with status:', res.status);
        const errorText = await res.text();
        console.error('refreshUserProfile: error details:', errorText);
        
        // Create a fallback user profile so modals can still work
        const fallbackProfile = {
          id: 'temp-' + Date.now(),
          email: userEmail,
          display_name: userEmail?.split('@')[0] || 'User',
          user_type: 'athlete',
          avatar: null
        };
        console.log('refreshUserProfile: using fallback profile:', fallbackProfile);
        setUserProfile(fallbackProfile);
      }
    } catch (error) {
      console.error('refreshUserProfile: catch error:', error);
      
      // Create a fallback user profile so modals can still work
      const fallbackProfile = {
        id: 'temp-' + Date.now(),
        email: userEmail,
        display_name: userEmail?.split('@')[0] || 'User',
        user_type: 'athlete',
        avatar: null
      };
      console.log('refreshUserProfile: using fallback profile after error:', fallbackProfile);
      setUserProfile(fallbackProfile);
    } finally {
      setProfileLoading(false);
    }
  }, [userEmail, profileLoading]);

  const handleStoryCreated = useCallback(() => {
    setStoriesRefreshTrigger(prev => prev + 1);
    setActiveTab('home');
  }, []);

  const handlePostCreated = useCallback(() => {
    setActiveTab('home');
  }, []);

  const handleCreateStoryClose = useCallback((open: boolean) => {
    if (!open) {
      setActiveTab('home');
    }
  }, []);

  const handleCreatePostClose = useCallback((open: boolean) => {
    if (!open) {
      setActiveTab('home');
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    if (userProfile?.id) {
      try {
        const res = await fetch(`${getBackendUrl()}/api/notifications/${userProfile.id}/unread-count`);
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    }
  }, [userProfile?.id]);

  const handleSaveChange = useCallback(() => {
    // Trigger refresh for saved posts view if needed
  }, []);

  const handleProfileClick = useCallback((profile: any) => {
    console.log('Profile clicked:', profile);
    if (!profile) {
      console.error('No profile provided to handleProfileClick');
      return;
    }
    
    setSelectedProfile(profile);
    setActiveTab('profile');
    
    // Update URL for proper navigation
    navigate('/profile', { replace: false });
  }, [navigate]);

  const handleBackFromProfile = useCallback(() => {
    console.log('Back from profile clicked');
    setSelectedProfile(null);
    setActiveTab('home');
    navigate('/home', { replace: false });
  }, [navigate]);

  const handleNotificationClick = useCallback((notification: Notification) => {
    console.log('Notification clicked:', notification);
    
    // If notification has a post, open the post detail view
    if (notification.post) {
      console.log('Setting viewing post:', notification.post);
      setViewingPost(notification.post);
      setActiveTab("post-detail");
    } else {
      console.error('Notification does not have post data:', notification);
    }
    setSelectedNotification(notification);
  }, []);



  // All useEffect hooks
  useEffect(() => {
    console.log('Index: useEffect[1] - checking saved email');
    const { email, sessionId } = getUserSession();
    console.log('Index: saved email found:', email, 'sessionId:', sessionId);
    
    if (email && sessionId) {
      console.log('Index: setting authenticated and email');
      setIsAuthenticated(true);
      setUserEmail(email);
    } else {
      // Clear any stale data
      sessionStorage.removeItem('userEmail');
      sessionStorage.removeItem('sessionId');
    }
    setIsInitialized(true);
    console.log('Index: initialization complete');
  }, []);

  useEffect(() => {
    console.log('Index: useEffect[2] - profile loading check', { 
      isAuthenticated, 
      userEmail, 
      hasUserProfile: !!userProfile 
    });
    
    if (isAuthenticated && userEmail && !userProfile) {
      console.log('Index: conditions met, calling refreshUserProfile');
      refreshUserProfile();
    } else {
      console.log('Index: conditions not met for refreshUserProfile');
    }
  }, [isAuthenticated, userEmail, userProfile, refreshUserProfile]);

  useEffect(() => {
    if (userProfile?.id) {
      const socket = getSocket();
      socket.emit('register', userProfile.id);
      
      return () => {
        socket.off('register');
      };
    }
  }, [userProfile?.id]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Computed user object with fallback
  const effectiveUser = useMemo(() => {
    if (userProfile) {
      console.log('Index: using real userProfile:', userProfile);
      return userProfile;
    }
    
    if (isAuthenticated && userEmail) {
      const fallbackUser = {
        id: 'temp-' + userEmail.replace(/[^a-zA-Z0-9]/g, ''),
        email: userEmail,
        display_name: userEmail?.split('@')[0] || 'User',
        user_type: 'athlete',
        avatar: null
      };
      console.log('Index: using fallback user:', fallbackUser);
      return fallbackUser;
    }
    
    console.log('Index: no user available');
    return null;
  }, [userProfile, isAuthenticated, userEmail]);

  const fetchNotificationCount = useCallback(async () => {
    if (!effectiveUser?.id) return;
    
    try {
      const response = await fetch(`${getBackendUrl()}/api/notifications/${effectiveUser.id}/unread-count`);
      if (response.ok) {
        const data = await response.json();
        setNotificationCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  }, [effectiveUser?.id]);

  const handleNavigateToMessages = useCallback((userId?: string) => {
    if (userId) {
      setTargetUserId(userId);
    }
    setActiveTab('messages');
  }, []);

  const handleClearTargetUser = useCallback(() => {
    setTargetUserId(null);
  }, []);

  const handleRefreshConversations = useCallback(() => {
    // Trigger immediate refresh of message count and conversations
    refreshMessageCount();
  }, [refreshMessageCount]);

  const handleLogout = useCallback(() => {
    // Clear all authentication state
    setIsAuthenticated(false);
    setUserEmail(null);
    setUserProfile(null);
    setActiveTab('home');
    setTabHistory(['home']);
    
    // Clear session storage
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('sessionId');
    
    // Clear any other state that should be reset
    setSelectedProfile(null);
    setViewingPost(null);
    setSelectedNotification(null);
    setTargetUserId(null);
    setNotifications([]);
    setProfiles({});
    setUnreadCount(0);
    setNotificationCount(0);
  }, []);

  // Add a more frequent polling for message count when user is active
  useEffect(() => {
    fetchNotificationCount();
    refreshMessageCount();
    
    // Set up polling for notification and message counts
    const interval = setInterval(() => {
      fetchNotificationCount();
      refreshMessageCount();
    }, 30000); // Poll every 30 seconds

    // Set up more frequent polling for message count when user is on messages tab
    const messageInterval = setInterval(() => {
      if (activeTab === 'messages') {
        refreshMessageCount();
      }
    }, 5000); // Poll every 5 seconds when on messages tab

    return () => {
      clearInterval(interval);
      clearInterval(messageInterval);
    };
  }, [fetchNotificationCount, refreshMessageCount, activeTab]);

  // Listen for profile image updates globally
  useEffect(() => {
    let refreshTimeout: NodeJS.Timeout | null = null;
    
    const handleProfileImageUpdate = (event: CustomEvent) => {
      if (event.detail.userId === userProfile?.id) {
        console.log('Profile image updated, refreshing user profile...');
        
        // Clear any existing timeout to prevent multiple rapid refreshes
        if (refreshTimeout) {
          clearTimeout(refreshTimeout);
        }
        
        // Debounce the profile refresh
        refreshTimeout = setTimeout(() => {
          refreshUserProfile();
        }, 500);
      }
    };

    window.addEventListener('profileImageUpdated', handleProfileImageUpdate as EventListener);
    
    return () => {
      window.removeEventListener('profileImageUpdated', handleProfileImageUpdate as EventListener);
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
    };
  }, [userProfile?.id, refreshUserProfile]);

  // Main content rendering
  const mainContent = useMemo(() => {
    console.log('Index: Rendering main content for activeTab:', activeTab);
    console.log('Index: selectedProfile:', selectedProfile);
    console.log('Index: effectiveUser:', effectiveUser);
    
    switch (activeTab) {
      case "home":
        return (
          <div className="w-full">
            {/* Stories Bar - Always at top */}
            <div className="w-full">
              <StoriesBar
                userProfile={effectiveUser}
                onAddStoryClick={() => setActiveTab("create-story")}
                refreshTrigger={storiesRefreshTrigger}
                onProfileClick={handleProfileClick}
                onLoadingComplete={() => {}}
              />
            </div>
            {/* Feed Content */}
            <div className="w-full">
              <Feed
                onProfileClick={handleProfileClick}
                userId={effectiveUser?.id}
                onSaveChange={handleSaveChange}
              />
            </div>
          </div>
        );
      case "reels":
        return <ReelsView onProfileClick={handleProfileClick} />;
      case "notifications":
        return (
          <NotificationsPage
            userId={effectiveUser?.id}
            onBack={() => setActiveTab("home")}
            onNotificationClick={handleNotificationClick}
            onProfileClick={handleProfileClick}
          />
        );
      case "messages":
        return (
          <MessagesView
            onProfileClick={handleProfileClick}
            currentUserId={effectiveUser?.id}
            targetUserId={targetUserId}
            onClearTargetUser={handleClearTargetUser}
            onRefreshConversations={handleRefreshConversations}
          />
        );
      case "profile":
        console.log('Index: Rendering ProfileView');
        return (
          <ProfileView
            profile={selectedProfile || effectiveUser}
            loggedInUserId={effectiveUser?.id}
            refreshUserProfile={refreshUserProfile}
            onSaveChange={handleSaveChange}
            onProfileClick={handleProfileClick}
            onBack={handleBackFromProfile}
            onNavigateToMessages={handleNavigateToMessages}
          />
        );
      case "network":
        return <NetworkView onProfileClick={handleProfileClick} />;
      case "events":
        return <EventsView />;
      case "competitions":
        return <CompetitionsView />;
      case "venues":
        return <VenuesView />;
      case "saved":
        return <SavedPostsView onProfileClick={handleProfileClick} userId={effectiveUser?.id} />;
      case "settings":
        return <SettingsView />;
      case "search":
        return <SearchView onProfileClick={handleProfileClick} userId={effectiveUser?.id} onSaveChange={handleSaveChange} />;
      case "post-detail":
        return viewingPost ? (
          <PostDetailView
            post={viewingPost}
            onBack={() => setActiveTab("home")}
            userId={effectiveUser?.id}
            onProfileClick={handleProfileClick}
          />
        ) : null;
      default:
        return (
          <div className="w-full">
            {/* Stories Bar - Always at top */}
            <div className="w-full">
              <StoriesBar
                userProfile={effectiveUser}
                onAddStoryClick={() => setActiveTab("create-story")}
                refreshTrigger={storiesRefreshTrigger}
                onProfileClick={handleProfileClick}
                onLoadingComplete={() => {}}
              />
            </div>
            {/* Feed Content */}
            <div className="w-full">
              <Feed
                onProfileClick={handleProfileClick}
                userId={effectiveUser?.id}
                onSaveChange={handleSaveChange}
              />
            </div>
          </div>
        );
    }
  }, [
    activeTab,
    userProfile,
    selectedProfile,
    storiesRefreshTrigger,
    profileUpdateTrigger,
    viewingPost,
    handleProfileClick,
    handleNotificationClick,
    handleSaveChange,
    notifications,
    profiles,
    effectiveUser,
    fetchNotificationCount,
    targetUserId,
    handleClearTargetUser,
    handleRefreshConversations,
    handleBackFromProfile,
  ]);

  // Conditional rendering AFTER all hooks
  if (!isInitialized || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <AuthSystem onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  if (profileLoading && !userProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0e9591] mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">

      
      {/* Mobile Header */}
      <div className="md:hidden">
        <MobileHeader
          userProfile={effectiveUser}
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          setIsAuthenticated={handleLogout}
          notificationCount={notificationCount}
          messageCount={messageCount}
          onNotificationClick={handleNotificationClick}
        />
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block">
        <Header
          userProfile={effectiveUser}
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          setIsAuthenticated={handleLogout}
          notificationCount={notificationCount}
          messageCount={messageCount}
          onNotificationClick={handleNotificationClick}
        />
      </div>

      {/* Desktop Layout */}
      <div className="flex max-w-7xl mx-auto pt-0 md:pt-16">
        {/* Left Sidebar - Desktop Only */}
        <div className="hidden lg:block w-64 fixed left-0 top-16 h-[calc(100vh-4rem)] z-10">
          <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <Sidebar
              activeTab={activeTab}
              setActiveTab={handleTabChange}
              userProfile={effectiveUser}
              setIsAuthenticated={handleLogout}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 lg:ml-64 xl:mr-80 min-h-[calc(100vh-4rem)] w-full">
          <main className="w-full pt-12 md:pt-16 lg:px-4 lg:max-w-2xl lg:mx-auto px-0 mx-0 pb-20 md:pb-0">
            {mainContent}
          </main>
        </div>

        {/* Right Panel - Desktop Only */}
        <div className="hidden xl:block w-80 fixed right-0 top-16 h-[calc(100vh-4rem)] z-10">
          <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <RightPanel onProfileClick={handleProfileClick} />
          </div>
        </div>
      </div>

      {/* Mobile Footer */}
      <MobileFooter
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        setIsAuthenticated={handleLogout}
        userProfile={effectiveUser}
        notificationCount={notificationCount}
        messageCount={messageCount}
        onNotificationClick={handleNotificationClick}
      />

      {/* Modals */}
      {activeTab === 'create-post' && (
        <CreatePost
          user={effectiveUser}
          onPostCreated={handlePostCreated}
          open={true}
          onOpenChange={handleCreatePostClose}
        />
      )}
      
      {activeTab === 'create-story' && (
        <CreateStory
          user={effectiveUser}
          onStoryCreated={handleStoryCreated}
          open={true}
          onOpenChange={handleCreateStoryClose}
        />
      )}
    </div>
  );
};

export default Index;
