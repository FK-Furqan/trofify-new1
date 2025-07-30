import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toProperCase } from "@/lib/utils";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { PostActions } from "./PostActions";
import { getBackendUrl } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { SupportService } from "@/lib/supportService";

interface PostModalProps {
  post: any;
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onProfileClick?: (profile: any) => void;
  onSaveChange?: () => void;
}

export const PostModal = ({ 
  post, 
  isOpen, 
  onClose, 
  userId, 
  onProfileClick, 
  onSaveChange 
}: PostModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [imageDimensions, setImageDimensions] = useState<{[key: number]: {width: number, height: number}}>({});
  const [layoutReady, setLayoutReady] = useState(false);
  const [api, setApi] = useState<any>();
  const [isSupporting, setIsSupporting] = useState(false);
  const [supportLoading, setSupportLoading] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setLoadedImages(new Set());
      setImageDimensions({});
      setLayoutReady(false);
    }
  }, [isOpen]);

  const handleProfileClick = async () => {
    if (onProfileClick) {
      try {
        // Fetch complete user profile data from backend
        const response = await fetch(`${getBackendUrl()}/api/users/${post.author.id}`);
        if (response.ok) {
          const completeProfile = await response.json();
          onProfileClick(completeProfile);
        } else {
          console.error('Failed to fetch complete profile, using fallback');
          // Fallback to basic profile data if fetch fails
          const fallbackProfile = {
            id: post.author.id,
            name: post.author.name,
            display_name: post.author.name,
            email: post.author.username?.replace('@', ''),
            avatar: post.author.avatar,
            sport: post.author.sport,
            user_type: post.author.sport,
            description: `Professional ${post.author.sport} Player | Passionate about sports and fitness`,
            badge: post.author.sport,
          };
          onProfileClick(fallbackProfile);
        }
      } catch (error) {
        console.error('Error fetching complete profile:', error);
        // Fallback to basic profile data if fetch fails
        const fallbackProfile = {
          id: post.author.id,
          name: post.author.name,
          display_name: post.author.name,
          email: post.author.username?.replace('@', ''),
          avatar: post.author.avatar,
          sport: post.author.sport,
          user_type: post.author.sport,
          description: `Professional ${post.author.sport} Player | Passionate about sports and fitness`,
          badge: post.author.sport,
        };
        onProfileClick(fallbackProfile);
      }
    }
  };

  // Handle support/un-support
  const handleSupportClick = async () => {
    if (!userId || !post.author?.id || userId === post.author.id || supportLoading) {
      return;
    }

    setSupportLoading(true);
    try {
      const result = await SupportService.toggleSupport(userId, post.author.id);
      setIsSupporting(result.action === 'supported');

      if (result.action === 'supported') {
        toast({
          title: "Support Added",
          description: `You are now supporting ${post.author.name}`,
          variant: "success"
        });
      } else {
        toast({
          title: "Support Removed",
          description: `You are no longer supporting ${post.author.name}`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error toggling support:', error);
      toast({
        title: "Error",
        description: "Failed to update support status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSupportLoading(false);
    }
  };

  // Check if current user is supporting this post author
  useEffect(() => {
    const checkSupportStatus = async () => {
      if (!userId || !post.author?.id || userId === post.author.id) {
        return;
      }

      try {
        const supporting = await SupportService.isSupporting(userId, post.author.id);
        setIsSupporting(supporting);
      } catch (error) {
        console.error('Error checking support status:', error);
      }
    };

    checkSupportStatus();
  }, [userId, post.author?.id]);

  // Helper to get the correct avatar URL
  const getAvatarUrl = (avatar?: string) => {
    if (!avatar) return "/placeholder.svg";
    if (avatar.startsWith("http")) return avatar;
    return "/placeholder.svg";
  };

  // Helper to get all images for the post (copied from PostCard for consistency)
  const getImages = () => {
    if (Array.isArray(post.images) && post.images.length > 0) return post.images;
    if (typeof post.images === 'string') {
      try {
        const arr = JSON.parse(post.images);
        if (Array.isArray(arr)) return arr;
      } catch {}
    }
    if (post.image) return [post.image];
    return [];
  };

  const images = getImages();

  const handleImageLoad = (index: number, event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.target as HTMLImageElement;
    setImageDimensions(prev => ({
      ...prev,
      [index]: { width: img.naturalWidth, height: img.naturalHeight }
    }));
    setLoadedImages(prev => new Set([...prev, index]));
    
    // Mark layout as ready when first image loads
    if (index === 0) {
      setLayoutReady(true);
    }
  };

  const isImageLoaded = (index: number) => {
    return loadedImages.has(index);
  };

  const isLandscape = (index: number) => {
    const dimensions = imageDimensions[index];
    return dimensions && dimensions.width > dimensions.height;
  };

  const isPortrait = (index: number) => {
    const dimensions = imageDimensions[index];
    return dimensions && dimensions.height > dimensions.width;
  };

  const isSquare = (index: number) => {
    const dimensions = imageDimensions[index];
    return dimensions && Math.abs(dimensions.width - dimensions.height) < 50;
  };

  // Calculate optimal image container height based on aspect ratio
  const getImageContainerHeight = (index: number) => {
    if (!imageDimensions[index]) return '60vh'; // Default fallback
    
    const { width, height } = imageDimensions[index];
    const aspectRatio = width / height;
    
    // Available viewport height minus header and actions
    const availableHeight = window.innerHeight * 0.95 - 200; // 95vh - header/actions
    
    if (isPortrait(index)) {
      // Portrait images: use more height, max 80% of viewport
      return Math.min(availableHeight * 0.8, height) + 'px';
    } else if (isLandscape(index)) {
      // Landscape images: use less height, max 60% of viewport
      return Math.min(availableHeight * 0.6, height) + 'px';
    } else {
      // Square images: balanced height
      return Math.min(availableHeight * 0.7, height) + 'px';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl !w-[calc(100vw-2rem)] sm:!w-[95vw] max-h-[95vh] p-0 gap-0 bg-card rounded-xl flex flex-col overflow-hidden !left-[50%] !-translate-x-[50%] !top-[50%] !-translate-y-[50%]">
        {/* Header - always at the top */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card z-10 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8" onClick={handleProfileClick}>
              <AvatarImage src={getAvatarUrl(post.author.avatar)} />
              <AvatarFallback>{post.author.name?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-1">
                <span
                  className="trofify-profile-name cursor-pointer hover:underline"
                  onClick={handleProfileClick}
                >
                  {post.author.name}
                </span>
                {userId !== post.author?.id && <span className="text-white text-xs">⦿</span>}
                {post.author.verified && (
                  <div className="w-3 h-3 bg-[#0e9591] rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
                {userId !== post.author?.id && (
                  <>
                    <div className="w-0.5"></div> {/* 2px gap */}
                    <span
                      className={`trofify-profile-name font-bold cursor-pointer hover:underline transition-all duration-200 hover:opacity-80 text-sm ${
                        isSupporting 
                          ? 'text-gray-400 opacity-70' 
                          : 'text-[#0e9591]'
                      }`}
                      onClick={handleSupportClick}
                      style={{ pointerEvents: supportLoading ? 'none' : 'auto', opacity: supportLoading ? 0.5 : 1 }}
                      title={isSupporting ? "Click to unsupport" : "Click to support"}
                    >
                      {supportLoading ? 'Loading...' : (isSupporting ? 'Supporting' : 'Support')}
                    </span>
                  </>
                )}
              </div>
                          <div className="flex flex-col space-y-1">
              <div></div> {/* Spacer for top */}
              <div className="flex items-center space-x-1">
                {post.author.userSport && (
                  <Badge variant="secondary" className="text-xs bg-gray-600 text-white w-fit flex items-center justify-center">
                    {toProperCase(post.author.userSport)}
                  </Badge>
                )}
                <Badge variant="secondary" className="text-xs bg-[#0e9591] text-white w-fit flex items-center justify-center">
                  {toProperCase(post.author.sport)}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {post.timeAgo}
              </div>
            </div>
            </div>
          </div>
          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-muted border-0"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Image area - dynamic height based on aspect ratio */}
        <div 
          className="w-full bg-card relative px-0 py-2 flex items-center justify-center" 
          style={{ 
            minHeight: '200px', 
            height: getImageContainerHeight(currentIndex),
            maxHeight: 'calc(95vh - 200px)'
          }}
        >
          {images.length > 1 ? (
            <Carousel
              className="w-full"
              opts={{ loop: true }}
              setApi={api => {
                if (api) {
                  api.on("select", () => setCurrentIndex(api.selectedScrollSnap()));
                }
              }}
            >
              <CarouselContent className="w-full">
                {images.map((img: string, idx: number) => (
                  <CarouselItem key={idx}>
                    <div 
                      className="relative w-full h-full flex items-center justify-center bg-card" 
                      style={{ 
                        minHeight: '200px', 
                        height: getImageContainerHeight(idx),
                        maxHeight: 'calc(95vh - 200px)'
                      }}
                    >
                      {!isImageLoaded(idx) && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
                        </div>
                      )}
                      <img
                        src={img}
                        alt={`Post image ${idx + 1}`}
                        className={`max-w-full max-h-full object-contain`}
                        onLoad={(e) => handleImageLoad(idx, e)}
                        style={{ opacity: isImageLoaded(idx) ? 1 : 0 }}
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4 bg-muted/50 hover:bg-muted/70 border-0" />
              <CarouselNext className="right-4 bg-muted/50 hover:bg-muted/70 border-0" />
            </Carousel>
          ) : images.length === 1 ? (
            <div 
              className="relative w-full h-full flex items-center justify-center bg-card" 
              style={{ 
                minHeight: '200px', 
                height: getImageContainerHeight(0),
                maxHeight: 'calc(95vh - 200px)'
              }}
            >
              {!isImageLoaded(0) && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
                </div>
              )}
              <img
                src={images[0]}
                alt="Post content"
                className={`max-w-full max-h-full object-contain`}
                onLoad={(e) => handleImageLoad(0, e)}
                style={{ opacity: isImageLoaded(0) ? 1 : 0 }}
              />
            </div>
          ) : null}

          {/* Pagination dots for multiple images */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {images.map((_, idx) => (
                <span
                  key={idx}
                  className={`inline-block w-2 h-2 rounded-full transition-all duration-200 ${
                    idx === currentIndex ? 'bg-[#0e9591]' : 'bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Post Content and Actions - always below image, always visible */}
        <div className="w-full bg-card flex flex-col border-t border-border flex-shrink-0 rounded-b-xl">
          <div className="p-4">
            <div className="text-sm text-foreground whitespace-pre-wrap break-words mb-4">
              {post.content || post.description || ""}
            </div>
            <PostActions
              postId={Number(post.id)}
              userId={userId}
              initialLikes={post.likes || 0}
              initialComments={post.comments || 0}
              initialShares={post.shares || 0}
              initialSaved={post.isSaved || false}
              initialLiked={post.isLiked || false}
              onProfileClick={onProfileClick}
              onSaveChange={onSaveChange}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 