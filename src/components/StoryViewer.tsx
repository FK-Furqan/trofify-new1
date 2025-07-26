import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Trash2, Loader2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getBackendUrl } from "@/lib/utils";

interface Story {
  id: string;
  user: string;
  avatar: string;
  mediaUrl: string;
  userId: string;
}

interface UserStory {
  userId: string;
  user: string;
  avatar: string;
  sport: string;
  stories: Story[];
}

interface StoryViewerProps {
  stories: UserStory[];
  initialStoryIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProfileClick?: (profile: any) => void;
  currentUserId?: string;
  onStoryDeleted?: () => void;
  onStoryViewed?: (storyId: string) => void;
}

export const StoryViewer = ({ 
  stories, 
  initialStoryIndex, 
  open, 
  onOpenChange,
  onProfileClick,
  currentUserId,
  onStoryDeleted,
  onStoryViewed
}: StoryViewerProps) => {


  // Memoize current story data to prevent unnecessary re-renders
  const currentUserStory = useMemo(() => {
    const story = stories[initialStoryIndex];
    return story;
  }, [stories, initialStoryIndex]);
  
  const userStories = useMemo(() => {
    const stories = currentUserStory?.stories || [];
    return stories;
  }, [currentUserStory]);
  
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);
  const [deletingStory, setDeletingStory] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const storyDuration = 5000; // 5 seconds
  const progressStep = 100 / (storyDuration / 50); // Update every 50ms

  // Memoize current story to prevent unnecessary re-renders
  const currentStory = useMemo(() => {
    const storyIndex = currentStoryIndex - initialStoryIndex;
    const story = userStories[storyIndex];
    return story;
  }, [currentStoryIndex, initialStoryIndex, userStories]);

  // Pre-load story images to prevent lag
  useEffect(() => {
    if (open && userStories.length > 0) {
      // Pre-load all story images for this user
      userStories.forEach(story => {
        if (story.mediaUrl) {
          const img = new Image();
          img.src = story.mediaUrl;
        }
      });
    }
  }, [open, userStories]);

  // Clean up intervals when component unmounts or modal closes
  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    };
  }, []);

  // Reset state when modal opens with a new story - optimized to prevent lag
  useEffect(() => {
    if (open) {
      // Reset state immediately when modal opens
      setCurrentStoryIndex(initialStoryIndex);
      setProgress(0);
      setDeletingStory(null);
      setIsDeleting(false);
      setLikeCount(0);
      setIsLiked(false);
      setIsLiking(false);
    } else {
      // Clean up when modal closes
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
      setProgress(0);
    }
  }, [open, initialStoryIndex]);

  // Fetch like count and user's like status
  const fetchLikeData = useCallback(async (storyId: string) => {
    if (!storyId) return;
    
    try {
      // Fetch like count
              const countRes = await fetch(`${getBackendUrl()}/api/stories/${storyId}/likes/count`);
      if (countRes.ok) {
        const countData = await countRes.json();
        setLikeCount(countData.count || 0);
      }
      
      // Fetch user's like status
      if (currentUserId) {
        const likeRes = await fetch(`${getBackendUrl()}/api/stories/${storyId}/likes/status?user_id=${currentUserId}`);
        if (likeRes.ok) {
          const likeData = await likeRes.json();
          setIsLiked(likeData.isLiked || false);
        }
      }
    } catch (error) {
      console.error('Error fetching like data:', error);
    }
  }, [currentUserId]);

  // Mark story as viewed after 1 second of playback and fetch like data
  useEffect(() => {
    if (open && currentStory && currentUserId && onStoryViewed) {
      const markAsViewed = () => {
        onStoryViewed(currentStory.id);
      };
      
      // Mark as viewed after 1 second to ensure user actually sees the story
      const timer = setTimeout(markAsViewed, 1000);
      
      // Fetch like data for the current story
      fetchLikeData(currentStory.id);
      
      return () => clearTimeout(timer);
    }
  }, [currentStory, currentUserId, open, onStoryViewed, fetchLikeData]);

  // Memoize like handler
  const handleLikeToggle = useCallback(async (storyId: string) => {
    if (!currentUserId || !storyId || isLiking) return;
    
    setIsLiking(true);
    
    try {
      const method = isLiked ? 'DELETE' : 'POST';
              const res = await fetch(`${getBackendUrl()}/api/stories/${storyId}/likes`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUserId }),
      });
      
      if (!res.ok) throw new Error('Failed to toggle like');
      
      // Update local state
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLiking(false);
    }
  }, [currentUserId, isLiked, isLiking]);

  // Memoize delete handler to prevent unnecessary re-renders
  const handleDeleteStory = useCallback(async (storyId: string) => {
    if (!currentUserId || !storyId) return;
    
    setDeletingStory(storyId);
    setIsDeleting(true);
    
    try {
              const res = await fetch(`${getBackendUrl()}/api/stories/${storyId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUserId }),
      });
      
      if (!res.ok) throw new Error('Failed to delete story');
      
      // Call the callback to refresh stories
      if (onStoryDeleted) {
        onStoryDeleted();
      }
      
      // Close the modal
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting story:', error);
    } finally {
      setDeletingStory(null);
      setIsDeleting(false);
    }
  }, [currentUserId, onStoryDeleted, onOpenChange]);

  // Memoize navigation handlers
  const handlePrevious = useCallback(() => {
    const currentIndexInUserStories = currentStoryIndex - initialStoryIndex;
    if (currentIndexInUserStories > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
    } else {
      onOpenChange(false);
    }
  }, [currentStoryIndex, initialStoryIndex, onOpenChange]);

  const handleNext = useCallback(() => {
    const currentIndexInUserStories = currentStoryIndex - initialStoryIndex;
    if (currentIndexInUserStories < userStories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onOpenChange(false);
    }
  }, [currentStoryIndex, initialStoryIndex, userStories.length, onOpenChange]);

  // Memoize keyboard handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!open) return;
    
    if (e.key === 'ArrowLeft') {
      handlePrevious();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    } else if (e.key === 'Escape') {
      onOpenChange(false);
    }
  }, [open, handlePrevious, handleNext, onOpenChange]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Optimized progress timer - only start when modal is open and story is valid
  useEffect(() => {
    if (!open || !currentStory) {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
      return;
    }

    // Clear any existing interval
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    // Start progress timer
    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          // Move to next story in the user's sequence or close
          const currentIndexInUserStories = currentStoryIndex - initialStoryIndex;
          if (currentIndexInUserStories < userStories.length - 1) {
            setCurrentStoryIndex(prev => prev + 1);
            return 0;
          } else {
            onOpenChange(false);
            return 0;
          }
        }
        return prev + progressStep;
      });
    }, 50);

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    };
  }, [open, currentStory, currentStoryIndex, userStories.length, onOpenChange, initialStoryIndex]);

  // Don't render anything if modal is not open
  if (!open) return null;

  // Don't render if no current story (prevents lag)
  if (!currentStory) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Loading overlay - only covers the modal content */}
      {isDeleting && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#0e9591]" />
            <p className="text-gray-700 font-medium">Deleting story...</p>
          </div>
        </div>
      )}
      {/* Progress bars - one for each story in the user's sequence */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="flex space-x-1">
          {userStories.map((_, index) => (
            <div key={index} className="flex-1 bg-gray-600 rounded-full h-1">
              <div 
                className={`h-full rounded-full transition-all duration-50 ${
                  index < (currentStoryIndex - initialStoryIndex)
                    ? 'bg-white' 
                    : index === (currentStoryIndex - initialStoryIndex)
                    ? 'bg-white' 
                    : 'bg-gray-600'
                }`}
                style={{
                  width: index === (currentStoryIndex - initialStoryIndex) ? `${progress}%` : 
                         index < (currentStoryIndex - initialStoryIndex) ? '100%' : '0%'
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="absolute top-8 left-4 right-4 z-10 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar 
            className="h-8 w-8 cursor-pointer"
            onClick={() => onProfileClick && onProfileClick({
              name: currentUserStory.user,
              avatar: currentUserStory.avatar,
              id: currentUserStory.userId
            })}
          >
            <AvatarImage src={currentUserStory.avatar || "/placeholder.svg"} />
            <AvatarFallback>{currentUserStory.user?.[0]?.toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
          <span className="text-white font-semibold">{currentUserStory.user}</span>
        </div>
        <div className="flex items-center space-x-2">
          {/* Like button and count */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleLikeToggle(currentStory.id)}
              disabled={isLiking}
                              className={`text-white hover:bg-white/20 ${isLiked ? 'text-[#0e9591]' : ''}`}
            >
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
            </Button>
            {likeCount > 0 && (
              <span className="text-white text-sm font-medium">{likeCount}</span>
            )}
          </div>
          
          {/* Delete button for own stories */}
          {currentUserStory.userId === currentUserId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteStory(currentStory.id)}
              disabled={isDeleting}
                              className="text-white hover:bg-[#0e9591]/20 hover:text-[#0e9591]"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Story Image - Instagram Style */}
      <div className="w-full h-full bg-black flex items-center justify-center">
        <img
          src={currentStory.mediaUrl}
          alt={currentStory.user}
          className="max-w-full max-h-full object-contain"
          style={{ 
            width: 'auto',
            height: 'auto'
          }}
        />
      </div>

      {/* Navigation buttons - for individual story viewing, we can remove these or make them close the modal */}
      <div className="absolute inset-0 flex items-center justify-between p-4">
        <button
          onClick={handlePrevious}
          className="w-1/3 h-full flex items-center justify-start opacity-0 hover:opacity-100 transition-opacity"
        >
          <ChevronLeft className="h-8 w-8 text-white" />
        </button>
        <button
          onClick={handleNext}
          className="w-1/3 h-full flex items-center justify-end opacity-0 hover:opacity-100 transition-opacity"
        >
          <ChevronRight className="h-8 w-8 text-white" />
        </button>
      </div>
    </div>
  );
}; 