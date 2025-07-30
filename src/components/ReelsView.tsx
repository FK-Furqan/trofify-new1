
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReelCard } from './ReelCard';
import { CreateReel } from './CreateReel';
import { ReelCommentModal } from './ReelCommentModal';
import { useToast } from '@/hooks/use-toast';
import { getBackendUrl } from '@/lib/utils';

interface Reel {
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

interface ReelsViewProps {
  currentUserId?: string;
  onProfileClick?: (userId: string) => void;
}

export const ReelsView: React.FC<ReelsViewProps> = ({ 
  currentUserId, 
  onProfileClick 
}) => {
  const [reels, setReels] = useState<Reel[]>([]);
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [showCreateReel, setShowCreateReel] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedReelId, setSelectedReelId] = useState<string | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchEndY, setTouchEndY] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const REELS_PER_PAGE = 10;

  // Fetch reels from backend
  const fetchReels = useCallback(async (pageOffset = 0, append = false) => {
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/reels/feed?limit=${REELS_PER_PAGE}&offset=${pageOffset}&userId=${currentUserId || ''}`
      );
      
        if (response.ok) {
        const data = await response.json();
        
        if (append) {
          setReels(prev => [...prev, ...data]);
        } else {
          setReels(data);
        }
        
        setHasMore(data.length === REELS_PER_PAGE);
        setOffset(pageOffset + data.length);
      }
    } catch (error) {
      console.error('Error fetching reels:', error);
      toast({
        title: "Error",
        description: "Failed to load reels.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, toast]);

  // Initial load
  useEffect(() => {
    fetchReels();
  }, [fetchReels]);

  // Handle scroll to load more reels
  const handleScroll = useCallback(() => {
    if (!containerRef.current || isLoading || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

    if (scrollPercentage > 0.8) {
      fetchReels(offset, true);
    }
  }, [fetchReels, offset, isLoading, hasMore]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndY(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!touchStartY || !touchEndY) return;

    const distance = touchStartY - touchEndY;
    const isSwipeUp = distance > 50;
    const isSwipeDown = distance < -50;

    if (isSwipeUp && currentReelIndex < reels.length - 1) {
      setCurrentReelIndex(prev => prev + 1);
    } else if (isSwipeDown && currentReelIndex > 0) {
      setCurrentReelIndex(prev => prev - 1);
    }

    setTouchStartY(0);
    setTouchEndY(0);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && currentReelIndex > 0) {
        e.preventDefault();
        setCurrentReelIndex(prev => prev - 1);
      } else if (e.key === 'ArrowDown' && currentReelIndex < reels.length - 1) {
        e.preventDefault();
        setCurrentReelIndex(prev => prev + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentReelIndex, reels.length]);

  // Handle reel interactions
  const handleLike = useCallback((reelId: string, liked: boolean) => {
    setReels(prev => prev.map(reel => {
      if (reel.id === reelId) {
        return {
          ...reel,
          is_liked: liked,
          like_count: liked ? reel.like_count + 1 : reel.like_count - 1
        };
      }
      return reel;
    }));
  }, []);

  const handleSave = useCallback((reelId: string, saved: boolean) => {
    setReels(prev => prev.map(reel => {
      if (reel.id === reelId) {
        return {
          ...reel,
          is_saved: saved
        };
      }
      return reel;
    }));
  }, []);

  const handleShare = useCallback((reelId: string) => {
    toast({
      title: "Shared!",
      description: "Reel has been shared successfully.",
    });
  }, [toast]);

  const handleCommentClick = useCallback((reelId: string) => {
    setSelectedReelId(reelId);
    setShowCommentModal(true);
  }, []);

  const handleReelCreated = useCallback((newReel: Reel) => {
    setReels(prev => [newReel, ...prev]);
    setShowCreateReel(false);
    toast({
      title: "Reel created!",
      description: "Your reel is now live.",
    });
  }, [toast]);

  // Record view when reel becomes active
  useEffect(() => {
    if (reels[currentReelIndex] && currentUserId) {
      const recordView = async () => {
        try {
          await fetch(`${getBackendUrl()}/api/reels/${reels[currentReelIndex].id}/view`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              userId: currentUserId,
              viewDuration: 0 
            }),
          });
        } catch (error) {
          console.error('Error recording view:', error);
        }
      };
      
      recordView();
    }
  }, [currentReelIndex, reels, currentUserId]);

  if (isLoading && reels.length === 0) {
    return (
      <div className="h-[calc(100vh-4rem)] bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] bg-black relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-white text-xl font-bold">Reels</h1>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
            >
              <Filter className="h-5 w-5" />
            </Button>
            <Button
              onClick={() => setShowCreateReel(true)}
              size="sm"
              className="bg-white text-black hover:bg-gray-100"
            >
              <Plus className="h-4 w-4 mr-1" />
              Create
            </Button>
          </div>
        </div>
      </div>

      {/* Reels Container */}
      <div
        ref={containerRef}
        className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide"
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="h-full flex flex-col">
          {reels.map((reel, index) => (
            <div
              key={reel.id}
              className="h-full flex-shrink-0 snap-start relative"
            >
              <ReelCard
                reel={reel}
                currentUserId={currentUserId}
                onProfileClick={onProfileClick}
                onCommentClick={handleCommentClick}
                onLike={handleLike}
                onSave={handleSave}
                onShare={handleShare}
                isActive={index === currentReelIndex}
                autoPlay={true}
              />
            </div>
          ))}
          
          {/* Loading indicator at bottom */}
          {isLoading && hasMore && (
            <div className="h-32 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
            </div>
          )}
        </div>
      </div>

      {/* Navigation Dots */}
      {reels.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {reels.map((_, index) => (
          <button
            key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentReelIndex 
                  ? 'bg-white scale-125' 
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              onClick={() => setCurrentReelIndex(index)}
          />
        ))}
      </div>
      )}

      {/* Create Reel Modal */}
      <AnimatePresence>
        {showCreateReel && (
          <CreateReel
            onClose={() => setShowCreateReel(false)}
            onReelCreated={handleReelCreated}
            userId={currentUserId || ''}
          />
        )}
      </AnimatePresence>

      {/* Comment Modal */}
      <AnimatePresence>
        {showCommentModal && selectedReelId && (
          <ReelCommentModal
            reelId={selectedReelId}
            isOpen={showCommentModal}
            onClose={() => {
              setShowCommentModal(false);
              setSelectedReelId(null);
            }}
            currentUserId={currentUserId}
            onProfileClick={onProfileClick}
          />
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!isLoading && reels.length === 0 && (
        <div className="h-full flex items-center justify-center text-white">
          <div className="text-center">
            <div className="text-6xl mb-4">📹</div>
            <h2 className="text-2xl font-bold mb-2">No Reels Yet</h2>
            <p className="text-gray-400 mb-6">
              Be the first to create an amazing reel!
            </p>
            <Button
              onClick={() => setShowCreateReel(true)}
              className="bg-white text-black hover:bg-gray-100"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Reel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
