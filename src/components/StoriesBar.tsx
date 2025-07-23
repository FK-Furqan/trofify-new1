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

const StoriesBarComponent = ({ userProfile, onAddStoryClick, refreshTrigger, onProfileClick, onLoadingComplete }) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingStory, setDeletingStory] = useState(null);
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [viewedStories, setViewedStories] = useState(new Set());

  console.log('StoriesBar rendering with userProfile:', userProfile);

  const fetchStories = useCallback(async () => {
    console.log('Fetching stories...');
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${getBackendUrl()}/api/stories`);
      console.log('Stories response status:', res.status);
      
      if (!res.ok) {
        if (res.status === 404) {
          console.log('No stories found (404)');
          setStories([]);
          return;
        }
        throw new Error(`Failed to fetch stories: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Stories data received:', data);
      
      // Group stories by user and map to the expected format
      const storiesMap = new Map();
      
      data.forEach((story: any) => {
        const user = story.users || {};
        const userId = story.user_id;
        
        if (!storiesMap.has(userId)) {
          storiesMap.set(userId, {
            id: userId,
            user: {
              id: userId,
              name: user.display_name || user.email || "Unknown User",
              username: user.email ? `@${user.email.split("@")[0]}` : "@unknown",
              avatar: user.avatar || "/placeholder.svg",
              email: user.email,
            },
            stories: [],
            hasUnread: false,
          });
        }
        
        storiesMap.get(userId).stories.push({
          id: story.id,
          type: story.media_url?.includes('.mp4') || story.media_url?.includes('.webm') ? 'video' : 'image',
          url: story.media_url,
          timestamp: story.created_at,
          viewed: viewedStories.has(story.id),
        });
      });
      
      // Convert map to array and sort by latest story
      const groupedStories = Array.from(storiesMap.values()).map(group => {
        // Sort stories within each group by timestamp (newest first)
        group.stories.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        // Check if there are unread stories
        group.hasUnread = group.stories.some(story => !story.viewed);
        
        return group;
      });
      
      // Sort groups by latest story timestamp
      groupedStories.sort((a, b) => {
        const latestA = new Date(a.stories[0]?.timestamp || 0).getTime();
        const latestB = new Date(b.stories[0]?.timestamp || 0).getTime();
        return latestB - latestA;
      });
      
      console.log('Processed stories:', groupedStories);
      setStories(groupedStories);
    } catch (err: any) {
      console.error("Failed to fetch stories:", err);
      setError("Unable to load stories");
      // Don't let story errors break the whole component
      setStories([]);
    } finally {
      setLoading(false);
      if (onLoadingComplete) onLoadingComplete();
    }
  }, [viewedStories, onLoadingComplete]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories, refreshTrigger]);

  const handleDeleteStory = async (storyId: number) => {
    if (!userProfile?.id) return;
    
    setDeletingStory(storyId);
    try {
      const res = await fetch(`${getBackendUrl()}/api/stories/${storyId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userProfile.id }),
      });
      
      if (!res.ok) throw new Error('Failed to delete story');
      
      // Refresh stories after deletion
      fetchStories();
    } catch (error) {
      console.error('Failed to delete story:', error);
      setError("Failed to delete story");
    } finally {
      setDeletingStory(null);
    }
  };

  const handleStoryClick = (storyIndex: number) => {
    setSelectedStoryIndex(storyIndex);
    setStoryViewerOpen(true);
  };

  const handleStoryView = (storyId: number) => {
    setViewedStories(prev => new Set([...prev, storyId]));
  };

  console.log('StoriesBar render state:', { loading, error, storiesCount: stories.length });

  // Always render the container, even if loading or error
  return (
    <div className="bg-card border-b border-border">
      <div className="flex space-x-1.5 sm:space-x-2.5 overflow-x-auto py-4 pl-3 pr-4 scrollbar-hide" style={{ marginLeft: '-20%' }}>
        {/* Add Story Button - Always show if user profile exists */}
        {userProfile && (
          <div 
            className="flex-shrink-0 cursor-pointer relative w-24 h-40 overflow-hidden group transition-all duration-200"
            style={{ 
              minWidth: '6rem', 
              maxWidth: '6rem',
              transform: 'skew(-15deg)',
              transformOrigin: 'center'
            }}
            onClick={onAddStoryClick}
          >
            <div 
              className="w-full h-full bg-muted border-2 border-dashed border-border hover:border-[#0e9591] transition-colors relative"
              style={{ transform: 'skew(15deg) scale(1.5)' }}
            >
              <div className="absolute top-8 right-2 w-4 h-4 bg-[#0e9591] rounded-full flex items-center justify-center shadow-sm">
                <Plus className="h-3 w-3 text-white font-bold" strokeWidth={4} />
              </div>
            </div>
            <div 
              className="absolute bottom-2 left-2 right-2 text-center text-xs font-semibold truncate bg-black/40 px-2 py-1 text-white"
              style={{ transform: 'skew(15deg) scale(0.9)' }}
            >
              Your Story
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className="flex-shrink-0 relative w-24 h-40 overflow-hidden"
                style={{ 
                  minWidth: '6rem', 
                  maxWidth: '6rem',
                  transform: 'skew(-15deg)',
                  transformOrigin: 'center'
                }}
              >
                <div 
                  className="w-full h-full bg-muted animate-pulse"
                  style={{ transform: 'skew(15deg) scale(1.5)' }}
                />
              </div>
            ))}
          </>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="flex-shrink-0 text-center text-red-500 py-2 px-4">
            <p className="text-sm">{error}</p>
            <button 
              onClick={fetchStories}
              className="mt-1 px-3 py-1 bg-[#0e9591] text-white rounded text-sm hover:bg-[#0c7b77]"
            >
              Retry
            </button>
          </div>
        )}

        {/* Stories */}
        {!loading && stories.map((userStory, index) => {
          const isViewed = !userStory.hasUnread;
          const hasBorder = !isViewed;
          
          return (
            <div
              key={userStory.id}
              className={`flex-shrink-0 cursor-pointer relative w-24 h-40 overflow-hidden group transition-all duration-200 ${
                hasBorder ? 'ring-2 ring-[#0e9591] ring-offset-1 ring-offset-background' : ''
              }`}
              style={{ 
                minWidth: '6rem', 
                maxWidth: '6rem',
                transform: 'skew(-15deg)',
                transformOrigin: 'center'
              }}
              onClick={() => handleStoryClick(index)}
            >
              <img
                src={userStory.stories?.[0]?.url || userStory.user.avatar}
                alt={userStory.user.name}
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
              {userProfile?.id === userStory.user.id && (
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
                        disabled={deletingStory === userStory.user.id}
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {userStory.stories.map((story) => (
                        <DropdownMenuItem
                          key={story.id}
                          className="text-red-500 focus:text-red-700"
                          onClick={async (e) => {
                            e.stopPropagation();
                            await handleDeleteStory(story.id);
                          }}
                          disabled={deletingStory === story.id}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {deletingStory === story.id ? "Deleting..." : "Delete"}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
              {/* User name at bottom */}
              <div 
                className="absolute bottom-2 left-2 right-2 text-white text-xs font-semibold truncate bg-black/40 px-2 py-1"
                style={{ transform: 'skew(15deg) scale(0.9)' }}
              >
                {userStory.user.name}
              </div>
            </div>
          );
        })}
      </div>

      {/* Separator line after stories */}
      <div className="border-b-2 border-border"></div>

      {/* Story Viewer */}
      {storyViewerOpen && stories.length > 0 && (
        <StoryViewer
          stories={stories.map(userStory => ({
            userId: userStory.user.id,
            user: userStory.user.name,
            avatar: userStory.user.avatar,
            sport: userStory.user.username || '',
            stories: userStory.stories.map(story => ({
              id: story.id,
              user: userStory.user.name,
              avatar: userStory.user.avatar,
              mediaUrl: story.url,
              userId: userStory.user.id
            }))
          }))}
          initialStoryIndex={selectedStoryIndex}
          open={storyViewerOpen}
          onOpenChange={(open) => setStoryViewerOpen(open)}
          onProfileClick={onProfileClick}
          currentUserId={userProfile?.id}
          onStoryDeleted={fetchStories}
          onStoryViewed={handleStoryView}
        />
      )}
    </div>
  );
};

export const StoriesBar = memo(StoriesBarComponent);
