import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus, MoreVertical, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StoryViewer } from "./StoryViewer";
import { getBackendUrl } from "@/lib/utils";

// Simple AuthManager implementation since it's not available in the current codebase
const AuthManager = {
  apiRequest: async (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  }
};

const StoriesBarComponent = ({ userProfile, onAddStoryClick, refreshTrigger, onProfileClick, onLoadingComplete }) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingStory, setDeletingStory] = useState(null);
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [viewedStories, setViewedStories] = useState(new Set());
  const [profilesCache, setProfilesCache] = useState(new Map()); // Cache for user profiles

  // Fetch viewed stories from backend
  const fetchViewedStories = useCallback(async () => {
    if (!userProfile?.id) return;
    
    try {
      const res = await AuthManager.apiRequest(`${getBackendUrl()}/api/stories/viewed/${userProfile.id}`);
      if (res.ok) {
        const data = await res.json();
        // Backend returns { viewedStoryIds: [...] }
        const viewedStoryIds = data.viewedStoryIds || [];
        setViewedStories(new Set(viewedStoryIds));
      } else {
        console.error('Failed to fetch viewed stories:', res.status, res.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch viewed stories:', error);
    }
  }, [userProfile?.id]);

  // Memoize the fetch stories function to prevent unnecessary re-creation
  const fetchStories = useCallback(async () => {
    if (!userProfile?.id) return;
    
    setLoading(true);
    setError("");
    try {
      // Include viewer_id to get viewed status
      const res = await AuthManager.apiRequest(`${getBackendUrl()}/api/stories?viewer_id=${userProfile.id}`);
      if (!res.ok) throw new Error("Failed to fetch stories");
      const data = await res.json();
      
      // Map API data to story structure with profile caching
      const mapped = await Promise.all(data.map(async (story: any) => {
        const user = story.users || {};
        let author = {
              name: user.display_name || user.email || "Unknown User",
              username: user.email ? `@${user.email.split("@")[0]}` : "@unknown",
          avatar: user.avatar || "",
          sport: user.user_type || story.user_type,
          verified: false,
          id: story.user_id,
        };

        // Check cache first
        if (profilesCache.has(user.email)) {
          const cachedProfile = profilesCache.get(user.email);
          author = {
            name: cachedProfile.display_name || cachedProfile.name || user.display_name || user.email,
            username: user.email ? `@${user.email.split("@")[0]}` : "@unknown",
            avatar: cachedProfile.avatar || user.avatar || "",
            sport: cachedProfile.sport || cachedProfile.user_type || user.user_type,
            verified: false,
            id: story.user_id,
          };
        } else {
          // Fetch profile only if not cached
          try {
            const profileRes = await AuthManager.apiRequest(`${getBackendUrl()}/signup/profile`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: user.email }),
            });
            if (profileRes.ok) {
              const profile = await profileRes.json();
              // Cache the profile
              setProfilesCache(prev => new Map(prev).set(user.email, profile));
              author = {
                name: profile.display_name || profile.name || user.display_name || user.email,
                username: user.email ? `@${user.email.split("@")[0]}` : "@unknown",
                avatar: profile.avatar || user.avatar || "",
                sport: profile.sport || profile.user_type || user.user_type,
                verified: false,
                id: story.user_id,
              };
            }
          } catch {}
        }
        
        return {
          id: story.id,
          user: author.name,
          avatar: author.avatar || "",
          sport: author.sport,
          isAddStory: false,
          mediaUrl: story.media_url,
          userId: story.user_id,
          createdAt: story.created_at,
          viewed: story.viewed || false,
        };
      }));

      // Group stories by user
      const groupedStories = mapped.reduce((acc, story) => {
        if (!acc[story.userId]) {
          acc[story.userId] = {
            userId: story.userId,
            user: story.user,
            avatar: story.avatar,
            sport: story.sport,
            stories: []
          };
        }
        acc[story.userId].stories.push(story);
        return acc;
      }, {});

      // Convert to array and sort
      const userStoriesArray = Object.values(groupedStories);
      const sortedStories = userStoriesArray.sort((a: any, b: any) => {
        if (a.userId === userProfile?.id) return -1;
        if (b.userId === userProfile?.id) return 1;
        const aLatest = Math.max(...a.stories.map((s: any) => new Date(s.createdAt || 0).getTime()));
        const bLatest = Math.max(...b.stories.map((s: any) => new Date(s.createdAt || 0).getTime()));
        return bLatest - aLatest;
      });

      setStories(sortedStories);
    } catch (err: any) {
      setError(err.message || "Failed to load stories");
    } finally {
      setLoading(false);
      if (onLoadingComplete) onLoadingComplete();
    }
  }, [userProfile?.id, profilesCache]);

  // Fetch stories and viewed status on mount and when refreshTrigger changes
  useEffect(() => {
    fetchStories();
    fetchViewedStories();
  }, [fetchStories, fetchViewedStories, refreshTrigger]);

  // Fetch viewed stories when user profile changes
  useEffect(() => {
    if (userProfile?.id) {
      fetchViewedStories();
    }
  }, [userProfile?.id, fetchViewedStories]);

  // Listen for custom refresh events
  useEffect(() => {
    const handleRefresh = () => {
      fetchStories();
    };
    
    window.addEventListener('storiesRefresh', handleRefresh);
    return () => window.removeEventListener('storiesRefresh', handleRefresh);
  }, [fetchStories]);

  // Memoize delete handler
  const handleDeleteStory = useCallback(async (userId: string) => {
    if (!userProfile?.id) return;
    
    setDeletingStory(userId);
    try {
      // Get all stories for this user
      const userStories = stories.find(s => s.userId === userId)?.stories || [];
      
      // Delete all stories for this user
      await Promise.all(userStories.map(story => 
        AuthManager.apiRequest(`${getBackendUrl()}/api/stories/${story.id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userProfile.id }),
        })
      ));
      
      // Update local state immediately
      setStories(prev => prev.filter(s => s.userId !== userId));
    } catch (err) {
      console.error('Error deleting story:', err);
      setError('Failed to delete story');
    } finally {
      setDeletingStory(null);
    }
  }, [userProfile?.id, stories]);

  // Memoize display stories to prevent unnecessary re-renders
  const displayStories = useMemo(() => {
    const displayStories = [];
    
    // Always add "Add Story" button first
    displayStories.push({
      id: 'add-story',
      user: "You",
      avatar: userProfile?.avatar || "",
      isAddStory: true,
      isUserStory: true
    });
    
    // Add user's own stories (if they have any)
    const userStories = stories.filter(userStory => userStory.userId === userProfile?.id);
    displayStories.push(...userStories);
    
    // Add other users' stories
    const otherStories = stories.filter(userStory => userStory.userId !== userProfile?.id);
    displayStories.push(...otherStories);
    
    return displayStories;
  }, [stories, userProfile?.id, userProfile?.avatar]);

  // Memoize story click handler
  const handleStoryClick = useCallback((userStoryIndex) => {
    // Debug: Log the clicked story data
    const clickedStory = displayStories[userStoryIndex];
    
    // Find the actual index in the stories array
    const actualStoryIndex = stories.findIndex(story => story.userId === clickedStory.userId);
    
    if (actualStoryIndex === -1) {
      console.error('Story not found in stories array:', clickedStory);
      return;
    }
    
    setSelectedStoryIndex(actualStoryIndex);
    setStoryViewerOpen(true);
  }, [displayStories, stories]);

  // Memoize story viewed handler
  const handleStoryViewed = useCallback(async (storyId: string) => {
    if (!userProfile?.id || !storyId) return;
    
    try {
      // Update local state immediately for instant UI feedback
      setViewedStories(prev => {
        const newSet = new Set(prev);
        newSet.add(storyId);
        return newSet;
      });
      
      // Send to backend
      const res = await AuthManager.apiRequest(`${getBackendUrl()}/api/stories/${storyId}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ viewer_id: userProfile.id }),
      });

      if (!res.ok) {
        throw new Error(`Backend responded with ${res.status}`);
      }
    } catch (error) {
      console.error('Failed to mark story as viewed:', error);
      // Revert local state if backend call fails
      setViewedStories(prev => {
        const newSet = new Set(prev);
        newSet.delete(storyId);
        return newSet;
      });
    }
  }, [userProfile?.id]);

  // Memoize story deletion callback
  const handleStoryDeleted = useCallback(() => {
    // Update local state immediately without full refresh
    fetchStories();
  }, [fetchStories]);

  // Memoize modal close handler to prevent unnecessary re-renders
  const handleStoryViewerClose = useCallback((open: boolean) => {
    setStoryViewerOpen(open);
  }, []);

  // Memoize the check for viewed stories - optimized to prevent unnecessary calculations
  const areAllStoriesViewed = useCallback((userStory) => {
    if (!userStory.stories || userStory.stories.length === 0) return true;
    
    // Check if all individual stories for this user are viewed
    // Only consider stories as viewed if they're in the viewedStories set (viewed for 1+ second)
    const allViewed = userStory.stories.every(story => viewedStories.has(story.id));
    
    return allViewed;
  }, [viewedStories]);

  // Pre-calculate viewed status for all stories to prevent repeated calculations
  const storyViewedStatus = useMemo(() => {
    const status = new Map();
    displayStories.forEach((userStory, index) => {
      if (!userStory.isAddStory) {
        const isViewed = areAllStoriesViewed(userStory);
        status.set(index, isViewed);
      }
    });
    return status;
  }, [displayStories, areAllStoriesViewed]);



  // Helper function to get proper media URL
  const getMediaUrl = (mediaUrl: string) => {
    if (!mediaUrl) return "/placeholder.svg";
    if (mediaUrl.startsWith("http")) return mediaUrl;
    // Use Supabase URL format instead of AWS S3
    return `https://trofify-media.s3.amazonaws.com/${mediaUrl}`;
  };

  // Helper function to get proper avatar URL
  const getAvatarUrl = (avatar: string) => {
    if (!avatar) return "/placeholder.svg";
    if (avatar.startsWith("http")) return avatar;
    if (avatar.startsWith("/")) return avatar;
    return "/placeholder.svg";
  };

  if (loading) {
  return (
      <div className="flex space-x-1.5 sm:space-x-2.5 overflow-x-auto py-4 pl-5 pr-4 scrollbar-hide">
        {/* Add Story skeleton */}
        <div 
          className="flex-shrink-0 relative w-24 h-40 overflow-hidden"
          style={{ 
            minWidth: '6rem', 
            maxWidth: '6rem',
            transform: 'skew(-15deg)',
            transformOrigin: 'center'
          }}
        >
          <div 
            className="w-full h-full bg-gray-200 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600"
            style={{ transform: 'skew(15deg) scale(1.5)' }}
          >
            <div className="absolute top-8 right-2 w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        {/* Story skeletons */}
        {[...Array(5)].map((_, index) => (
          <div 
            key={index}
            className="flex-shrink-0 relative w-24 h-40 overflow-hidden"
            style={{ 
              minWidth: '6rem', 
              maxWidth: '6rem',
              transform: 'skew(-15deg)',
              transformOrigin: 'center'
            }}
          >
            {/* Story background skeleton */}
            <div 
              className="absolute inset-0 w-full h-full bg-gray-200 dark:bg-gray-700"
              style={{ 
                objectPosition: 'center',
                transform: 'skew(15deg) scale(1.5)',
                transformOrigin: 'center'
              }}
            />
            
            {/* Overlay skeleton */}
            <div 
              className="absolute inset-0 bg-gradient-to-t from-gray-300/60 dark:from-gray-600/60 via-gray-200/10 dark:via-gray-700/10 to-transparent"
              style={{ transform: 'skew(15deg) scale(1.5)' }}
            />
            
            {/* User name skeleton at bottom */}
            <div 
              className="absolute bottom-2 left-2 right-2 bg-gray-300 dark:bg-gray-600 px-2 py-1 animate-pulse"
              style={{ transform: 'skew(15deg) scale(0.9)' }}
            >
              <div className="w-12 h-3 bg-gray-400 dark:bg-gray-500 rounded"></div>
            </div>
          </div>
        ))}
              </div>
    );
  }

  if (error) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 px-4">
        <div className="flex flex-col items-center space-y-2 min-w-[80px]">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
            <span className="text-red-500 text-xs">Error</span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Failed to load</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex space-x-1.5 sm:space-x-2.5 overflow-x-auto py-4 pl-5 pr-4 scrollbar-hide">
        {displayStories.map((userStory, index) => {
          const isViewed = storyViewedStatus.get(index);
          // Fix: Only show border for unviewed stories (not add story button)
          // Border should only be removed when ALL stories from this user have been viewed for 1+ second
          const hasBorder = !isViewed && !userStory.isAddStory;
          
          return (
            <div
              key={userStory.id || userStory.userId}
              className={`flex-shrink-0 cursor-pointer relative w-24 h-40 overflow-hidden group transition-all duration-200 ${
                hasBorder ? 'ring-2 ring-[#0e9591] ring-offset-1 ring-offset-background' : ''
              } ${userStory.isAddStory ? '-ml-24' : ''}`}
              style={{ 
                minWidth: '6rem', 
                maxWidth: '6rem',
                transform: 'skew(-15deg)',
                transformOrigin: 'center'
              }}
              onClick={userStory.isAddStory ? onAddStoryClick : () => handleStoryClick(index)}
            >
              {/* Story Card Background */}
              {userStory.isAddStory ? (
                <div 
                  className="w-full h-full bg-muted border-2 border-dashed border-border hover:border-[#0e9591] transition-colors relative"
                  style={{ transform: 'skew(15deg) scale(1.5)' }}
                >
                  <div className="absolute top-8 right-2 w-4 h-4 bg-[#0e9591] rounded-full flex items-center justify-center shadow-sm">
                    <Plus className="h-3 w-3 text-white font-bold" strokeWidth={4} />
                  </div>
                </div>
              ) : (
                <>
                  <img
                    src={getMediaUrl(userStory.stories?.[0]?.mediaUrl || userStory.mediaUrl)}
                    alt={userStory.user}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ 
                  objectPosition: 'center',
                  transform: 'skew(15deg) scale(1.5)',
                  transformOrigin: 'center'
                }}
              />
              {/* Overlay for darkening image for text readability */}
              <div 
                className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"
                style={{ transform: 'skew(15deg) scale(1.5)' }}
              />
              {/* Delete button for own stories */}
                  {userStory.userId === userProfile?.id && (
                <div 
                  className="absolute top-2 right-2"
                  style={{ transform: 'skew(15deg) scale(0.9)' }}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full"
                            disabled={deletingStory === userStory.userId}
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-red-500 focus:text-red-700"
                          onClick={async (e) => {
                            e.stopPropagation();
                              await handleDeleteStory(userStory.userId);
                          }}
                            disabled={deletingStory === userStory.userId}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                            {deletingStory === userStory.userId ? "Deleting..." : "Delete"}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
              {/* User name at bottom */}
              <div 
                className="absolute bottom-2 left-2 right-2 text-white text-xs font-semibold truncate bg-black/40 px-2 py-1"
                style={{ transform: 'skew(15deg) scale(0.9)' }}
              >
                    {userStory.user}
              </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Separator line after stories */}
              <div className="border-b-4 border-border"></div>

      {/* Story Viewer Modal */}
        <StoryViewer
          stories={stories.map(userStory => ({
          userId: userStory.userId,
          user: userStory.user,
          avatar: getAvatarUrl(userStory.avatar),
          sport: userStory.sport,
            stories: userStory.stories.map(story => ({
              id: story.id,
            user: userStory.user,
            avatar: getAvatarUrl(userStory.avatar),
            mediaUrl: getMediaUrl(story.mediaUrl),
            userId: userStory.userId
            }))
          }))}
          initialStoryIndex={selectedStoryIndex}
          open={storyViewerOpen}
        onOpenChange={handleStoryViewerClose}
          onProfileClick={onProfileClick}
          currentUserId={userProfile?.id}
        onStoryDeleted={handleStoryDeleted}
        onStoryViewed={handleStoryViewed}
        />
    </>
  );
};

export const StoriesBar = memo(StoriesBarComponent);
