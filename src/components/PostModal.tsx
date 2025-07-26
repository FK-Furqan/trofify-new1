import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setLoadedImages(new Set());
      setImageDimensions({});
    }
  }, [isOpen]);

  const handleProfileClick = async () => {
    if (onProfileClick) {
      try {
        // Fetch complete user profile data from backend
        const response = await fetch(`${getBackendUrl()}/api/users/${post.author.id}`);
        if (response.ok) {
          const completeProfile = await response.json();
          console.log("PostModal: Complete profile fetched:", completeProfile);
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
  console.log('PostModal post:', post);
  console.log('PostModal images:', images);
  console.log('PostModal loadedImages:', loadedImages);

  const handleImageLoad = (index: number, event: React.SyntheticEvent<HTMLImageElement>) => {
    console.log(`Image ${index} loaded`);
    const img = event.target as HTMLImageElement;
    setImageDimensions(prev => ({
      ...prev,
      [index]: { width: img.naturalWidth, height: img.naturalHeight }
    }));
    setLoadedImages(prev => new Set([...prev, index]));
  };

  const isImageLoaded = (index: number) => {
    return loadedImages.has(index);
  };

  const isLandscape = (index: number) => {
    const dimensions = imageDimensions[index];
    return dimensions && dimensions.width > dimensions.height;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full sm:w-[95vw] h-[90vh] p-0 gap-0 bg-black rounded-lg flex flex-col overflow-hidden">
        {/* Header - always at the top */}
        <div className="flex items-center justify-between p-4 border-b border-[#23272f] bg-[#23272f] z-10">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8" onClick={handleProfileClick}>
              <AvatarImage src={getAvatarUrl(post.author.avatar)} />
              <AvatarFallback>{post.author.name?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-1">
                <span
                  className="font-semibold text-sm cursor-pointer hover:underline"
                  onClick={handleProfileClick}
                >
                  {post.author.name}
                </span>
                {post.author.verified && (
                  <div className="w-3 h-3 bg-[#0e9591] rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
                <Badge variant="secondary" className="text-xs bg-[#0e9591] text-white">
                  {post.author.sport}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {post.timeAgo}
              </div>
            </div>
          </div>
          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            className="bg-black/50 hover:bg-black/70 text-white border-0"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Image area - fixed max height, always visible, never flex-1 */}
        <div className="w-full bg-black relative px-0 py-4 flex items-center justify-center" style={{ maxHeight: '60vh', minHeight: '200px' }}>
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
                    <div className="relative w-full h-full flex items-center justify-center bg-black" style={{ maxHeight: '60vh', minHeight: '200px' }}>
                      {!isImageLoaded(idx) && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        </div>
                      )}
                      <img
                        src={img}
                        alt={`Post image ${idx + 1}`}
                        className={`max-w-full max-h-full ${isLandscape(idx) ? 'object-contain' : 'object-cover'}`}
                        onLoad={(e) => handleImageLoad(idx, e)}
                        style={{ opacity: isImageLoaded(idx) ? 1 : 0 }}
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4 bg-black/50 hover:bg-black/70 text-white border-0" />
              <CarouselNext className="right-4 bg-black/50 hover:bg-black/70 text-white border-0" />
            </Carousel>
          ) : images.length === 1 ? (
            <div className="relative w-full h-full flex items-center justify-center bg-black" style={{ maxHeight: '60vh', minHeight: '200px' }}>
              {!isImageLoaded(0) && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
              <img
                src={images[0]}
                alt="Post content"
                className={`max-w-full max-h-full ${isLandscape(0) ? 'object-contain' : 'object-cover'}`}
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
                    idx === currentIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Post Content and Actions - always below image, always visible */}
        <div className="w-full bg-[#23272f] flex flex-col text-white border-t border-[#23272f] max-h-[30vh] overflow-y-auto">
          <div className="p-4">
            <p className="text-sm mb-4 text-white/90">{post.content}</p>
          </div>
          <div className="border-t border-[#23272f] p-4">
            <PostActions
              postId={post.id}
              userId={userId}
              initialLikes={post.likes}
              initialComments={post.comments}
              initialShares={post.shares}
              initialSaved={post.isSaved}
              initialLiked={post.isLiked}
              onProfileClick={onProfileClick}
              onSaveChange={onSaveChange}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 