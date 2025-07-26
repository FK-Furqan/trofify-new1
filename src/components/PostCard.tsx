import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  MessageCircle,
  Share,
  Bookmark,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PostActions } from "./PostActions";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { getBackendUrl } from "@/lib/utils";

interface PostCardProps {
  post: any;
  onProfileClick?: (profile: any) => void;
  showTopMenu?: boolean;
  userId: string;
  onSaveChange?: () => void;
  onDelete?: (postId: string) => void;
  onPostClick?: (post: any) => void;
  isSaved?: boolean;
  variant?: 'list' | 'grid';
}

export const PostCard = ({ post, onProfileClick, showTopMenu = true, userId, onSaveChange, onDelete, onPostClick, isSaved = false, variant = 'list' }: PostCardProps) => {
  console.log('PostCard userId:', userId, 'for post', post.id);
  const [liked, setLiked] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleProfileClick = async () => {
    if (onProfileClick) {
      try {
        // Fetch complete user profile data from backend
        const response = await fetch(`${getBackendUrl()}/api/users/${post.author.id}`);
        if (response.ok) {
          const completeProfile = await response.json();
          console.log("PostCard: Complete profile fetched:", completeProfile);
          onProfileClick(completeProfile);
        } else {
          console.error('Failed to fetch complete profile, using fallback');
          // Fallback to basic profile data if fetch fails
          const fallbackProfile = {
            id: post.author.id,
            name: post.author.name,
            display_name: post.author.name,
            email: post.author.username.replace('@', ''),
            avatar: post.author.avatar,
            sport: post.author.sport,
            user_type: post.author.sport,
            description: `Professional ${post.author.sport} Player | Passionate about sports and fitness`,
            badge: post.author.sport,
          };
          console.log("PostCard: Using fallback profile:", fallbackProfile);
          onProfileClick(fallbackProfile);
        }
      } catch (error) {
        console.error('Error fetching complete profile:', error);
        // Fallback to basic profile data if fetch fails
        const fallbackProfile = {
          id: post.author.id,
          name: post.author.name,
          display_name: post.author.name,
          email: post.author.username.replace('@', ''),
          avatar: post.author.avatar,
          sport: post.author.sport,
          user_type: post.author.sport,
          description: `Professional ${post.author.sport} Player | Passionate about sports and fitness`,
          badge: post.author.sport,
        };
        console.log("PostCard: Using fallback profile:", fallbackProfile);
        onProfileClick(fallbackProfile);
      }
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    setDeleting(true);
    try {
      await onDelete(post.id);
    } catch (error) {
      console.error('Error deleting post:', error);
    } finally {
      setDeleting(false);
    }
  };

  // Check if this is the user's own post
  const isOwnPost = userId && post.author.id && userId === post.author.id.toString();

  // Helper to get the correct avatar URL
  const getAvatarUrl = (avatar?: string) => {
    if (!avatar) return "/placeholder.svg";
    if (avatar.startsWith("http")) return avatar;
    return "/placeholder.svg";
  };

  // Helper to get all images for the post
  const getImages = () => {
    // Support both single image (string) and multiple images (array)
    if (Array.isArray(post.images) && post.images.length > 0) return post.images;
    if (typeof post.images === 'string') {
      try {
        const arr = JSON.parse(post.images);
        if (Array.isArray(arr)) return arr;
      } catch {}
    }
    if (post.image) return [post.image];
    if (post.media_url) return [post.media_url];
    return [];
  };
  const images = getImages();
  console.log('PostCard images:', images, 'Post data:', post);
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <div
      className={
        variant === 'grid'
          ? 'bg-card rounded-lg shadow-sm flex flex-col h-full border border-border'
          : 'bg-card rounded-none lg:rounded-lg shadow-sm p-0 m-0 border-0 border-b-2 border-border'
      }
      style={variant === 'grid' ? { minHeight: 380, maxHeight: 480 } : {}}
    >
      {/* Header */}
      <div
        className={
          variant === 'grid'
            ? 'flex items-center gap-2 px-3 pt-3 pb-1'
            : 'flex items-center justify-between mb-4 px-4 lg:px-6 pt-4'
        }
      >
        <div className="flex items-center space-x-2">
          <Avatar
            className={variant === 'grid' ? 'h-8 w-8' : 'h-10 w-10'}
            onClick={handleProfileClick}
          >
            <AvatarImage src={getAvatarUrl(post.author.avatar)} />
            <AvatarFallback>{post.author.name?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center space-x-1">
              <span
                className="font-semibold text-foreground text-sm cursor-pointer hover:underline"
                onClick={handleProfileClick}
                style={variant === 'grid' ? { fontSize: '1rem' } : {}}
              >
                {post.author.name}
              </span>
              {post.author.verified && (
                <div className="w-4 h-4 bg-[#0e9591] rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
              <Badge variant="secondary" className="text-xs bg-[#0e9591] text-white">
                {post.author.sport}
              </Badge>
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <span>{post.timeAgo}</span>
            </div>
          </div>
        </div>
        {showTopMenu && isOwnPost && variant !== 'grid' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onDelete && (
                <DropdownMenuItem
                  className="text-red-500 focus:text-red-700"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleting ? 'Deleting...' : 'Delete'}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Content */}
      <div className={variant === 'grid' ? 'flex-1 flex flex-col justify-start px-3 pb-2' : 'mb-2'}>
        <p
          className={
            variant === 'grid'
              ? 'text-foreground font-medium mb-2 line-clamp-2 cursor-pointer'
              : 'text-foreground mb-4 px-4 lg:px-6 cursor-pointer hover:bg-muted/50 transition-colors'
          }
          onClick={() => onPostClick && onPostClick(post)}
        >
          {post.content}
        </p>
        {images.length > 1 ? (
          <div className="relative w-full">
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
                      className={
                        variant === 'grid'
                          ? 'w-full aspect-square bg-gray-100 rounded-md mb-2 cursor-pointer hover:opacity-90 transition-opacity overflow-hidden'
                          : 'w-full aspect-square bg-gray-100 rounded-none lg:rounded-lg m-0 cursor-pointer hover:opacity-90 transition-opacity overflow-hidden'
                      }
                      onClick={() => onPostClick && onPostClick(post)}
                    >
                      <img
                        src={img}
                        alt={`Post image ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
            {/* Pagination dots */}
            <div className="flex justify-center mt-2 space-x-1">
              {images.map((_, idx) => (
                <span
                  key={idx}
                  className={`inline-block w-2 h-2 rounded-full transition-all duration-200 ${idx === currentIndex ? 'bg-[#0e9591]' : 'bg-muted-foreground/30'}`}
                />
              ))}
            </div>
          </div>
        ) : images.length === 1 ? (
          <div 
            className={
              variant === 'grid'
                ? 'w-full aspect-square bg-gray-100 rounded-md mb-2 cursor-pointer hover:opacity-90 transition-opacity overflow-hidden'
                : 'w-full aspect-square bg-gray-100 rounded-none lg:rounded-lg m-0 cursor-pointer hover:opacity-90 transition-opacity overflow-hidden'
            }
            onClick={() => onPostClick && onPostClick(post)}
          >
            <img
              src={images[0]}
              alt="Post content"
              className="w-full h-full object-cover"
            />
          </div>
        ) : null}
      </div>

      {/* Actions */}
      <div className={variant === 'grid' ? 'mt-auto' : ''}>
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
  );
};
