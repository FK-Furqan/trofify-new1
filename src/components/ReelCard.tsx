import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share, Bookmark, Volume2, VolumeX, MoreHorizontal, Play, Pause, Music, MapPin } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getBackendUrl } from '@/lib/utils';

interface ReelCardProps {
  reel: {
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
  };
  currentUserId?: string;
  onProfileClick?: (userId: string) => void;
  onCommentClick?: (reelId: string) => void;
  onLike?: (reelId: string, liked: boolean) => void;
  onSave?: (reelId: string, saved: boolean) => void;
  onShare?: (reelId: string) => void;
  isActive?: boolean;
  autoPlay?: boolean;
}

export const ReelCard: React.FC<ReelCardProps> = ({
  reel,
  currentUserId,
  onProfileClick,
  onCommentClick,
  onLike,
  onSave,
  onShare,
  isActive = false,
  autoPlay = true
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(reel.is_liked || false);
  const [isSaved, setIsSaved] = useState(reel.is_saved || false);
  const [likeCount, setLikeCount] = useState(reel.like_count || 0);
  const [showControls, setShowControls] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  // Auto-play when reel becomes active
  useEffect(() => {
    if (isActive && autoPlay) {
      playVideo();
    } else {
      pauseVideo();
    }
  }, [isActive, autoPlay]);

  // Load video metadata
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.addEventListener('loadedmetadata', () => {
        if (videoRef.current) {
          setDuration(videoRef.current.duration);
        }
      });
    }
  }, []);

  const playVideo = async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Error playing video:', error);
      }
    }
  };

  const pauseVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleVideoClick = () => {
    if (isPlaying) {
      pauseVideo();
    } else {
      playVideo();
    }
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleLike = async () => {
    if (!currentUserId) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to like reels.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`${getBackendUrl()}/api/reels/${reel.id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: currentUserId }),
      });

      if (response.ok) {
        const { liked } = await response.json();
        setIsLiked(liked);
        setLikeCount(prev => liked ? prev + 1 : prev - 1);
        onLike?.(reel.id, liked);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like status.",
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    if (!currentUserId) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to save reels.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`${getBackendUrl()}/api/reels/${reel.id}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: currentUserId }),
      });

      if (response.ok) {
        const { saved } = await response.json();
        setIsSaved(saved);
        onSave?.(reel.id, saved);
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      toast({
        title: "Error",
        description: "Failed to update save status.",
        variant: "destructive"
      });
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: reel.caption || 'Check out this reel!',
          url: `${window.location.origin}/reels/${reel.id}`,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${window.location.origin}/reels/${reel.id}`);
        toast({
          title: "Link copied!",
          description: "Reel link has been copied to clipboard.",
        });
      }

      // Record share in backend
      if (currentUserId) {
        await fetch(`${getBackendUrl()}/api/reels/${reel.id}/share`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: currentUserId, sharedTo: 'general' }),
        });
      }

      onShare?.(reel.id);
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatTime = (time: number | null | undefined) => {
    if (time === null || time === undefined || isNaN(time)) {
      return '0:00';
    }
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatCount = (count: number | null | undefined) => {
    if (count === null || count === undefined) {
      return '0';
    }
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      {/* Video Player */}
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          src={reel.video_url || ''}
          poster={reel.thumbnail_url || undefined}
          className="w-full h-full object-cover"
          onTimeUpdate={handleVideoTimeUpdate}
          onEnded={handleVideoEnded}
          muted={isMuted}
          loop
          playsInline
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
        />

        {/* Video Controls Overlay */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/20"
              onClick={handleVideoClick}
            >
              <Button
                variant="ghost"
                size="lg"
                className="bg-black/20 hover:bg-black/40 text-white"
              >
                {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
          <div className="flex items-center justify-between text-white text-xs mb-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-1">
            <div
              className="bg-white h-1 rounded-full transition-all"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Mute/Unmute Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMuteToggle}
          className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white"
        >
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </Button>
      </div>

      {/* Right Side Action Buttons */}
      <div className="absolute right-4 bottom-20 flex flex-col items-center space-y-4">
        {/* Profile Avatar */}
        <div className="flex flex-col items-center space-y-2">
          <Avatar
            className="h-12 w-12 cursor-pointer border-2 border-white"
            onClick={() => onProfileClick?.(reel.user.id)}
          >
            <AvatarImage src={reel.user.avatar} />
            <AvatarFallback>{reel.user.name?.[0] || 'U'}</AvatarFallback>
          </Avatar>
        </div>

        {/* Like Button */}
        <div className="flex flex-col items-center space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`text-white p-2 ${isLiked ? 'text-red-500' : ''}`}
          >
            <Heart className={`h-6 w-6 ${isLiked ? 'fill-current' : ''}`} />
          </Button>
          <span className="text-white text-xs font-medium">{formatCount(likeCount)}</span>
        </div>

        {/* Comment Button */}
        <div className="flex flex-col items-center space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCommentClick?.(reel.id)}
            className="text-white p-2"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
          <span className="text-white text-xs font-medium">{formatCount(reel.comment_count)}</span>
        </div>

        {/* Share Button */}
        <div className="flex flex-col items-center space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="text-white p-2"
          >
            <Share className="h-6 w-6" />
          </Button>
        </div>

        {/* Save Button */}
        <div className="flex flex-col items-center space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            className={`text-white p-2 ${isSaved ? 'text-yellow-400' : ''}`}
          >
            <Bookmark className={`h-6 w-6 ${isSaved ? 'fill-current' : ''}`} />
          </Button>
        </div>

        {/* More Options */}
        <Button
          variant="ghost"
          size="sm"
          className="text-white p-2"
        >
          <MoreHorizontal className="h-6 w-6" />
        </Button>
      </div>

      {/* Bottom Content */}
      <div className="absolute bottom-4 left-4 right-20 text-white">
        {/* User Info */}
        <div className="flex items-center space-x-2 mb-2">
          <span
            className="font-semibold text-sm cursor-pointer hover:underline"
            onClick={() => onProfileClick?.(reel.user.id)}
          >
            {reel.user.name || 'Unknown User'}
          </span>
          {reel.user.user_type && (
            <Badge variant="secondary" className="text-xs">
              {reel.user.user_type}
            </Badge>
          )}
        </div>

        {/* Caption */}
        {reel.caption && (
          <p className="text-sm mb-2 line-clamp-2">{reel.caption}</p>
        )}

        {/* Hashtags */}
        {reel.hashtags && Array.isArray(reel.hashtags) && reel.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {reel.hashtags.map((tag, index) => (
              <span key={index} className="text-blue-400 text-sm">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Audio Attribution */}
        {reel.audio_attribution && (
          <div className="flex items-center space-x-2 text-sm text-gray-300">
            <Music className="h-4 w-4" />
            <span>{reel.audio_attribution}</span>
          </div>
        )}

        {/* Location */}
        {reel.location && (
          <div className="flex items-center space-x-2 text-sm text-gray-300 mt-1">
            <MapPin className="h-4 w-4" />
            <span>{reel.location}</span>
          </div>
        )}
      </div>
    </div>
  );
}; 