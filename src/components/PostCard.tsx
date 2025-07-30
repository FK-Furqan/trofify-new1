import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toProperCase } from "@/lib/utils";
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
import { getBackendUrl, getLatestProfileImage, shouldRefreshAvatar } from "@/lib/utils";
import { TaggedUsersRenderer } from "./TaggedUsersRenderer";
import { toast } from "@/components/ui/use-toast";
import { SupportService } from "@/lib/supportService";

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
  const [liked, setLiked] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [api, setApi] = useState<any>();
  const [isSupporting, setIsSupporting] = useState(false);
  const [supportLoading, setSupportLoading] = useState(false);

  const isOwnPost = userId === post.author?.id;

  const handleProfileClick = async () => {
    if (onProfileClick) {
      try {
        // Fetch complete user profile data from backend
        const response = await fetch(`${getBackendUrl()}/api/users/${post.author.id}`);
        if (response.ok) {
          const completeProfile = await response.json();
          onProfileClick(completeProfile);
        } else {
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
          onProfileClick(fallbackProfile);
        }
      } catch (error) {
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



  // Helper to get the correct avatar URL with latest image support
  const getAvatarUrl = (avatar?: string) => {
    if (!avatar) return "/placeholder.svg";
    
    // Check if we should use the latest profile image for the post author
    if (post?.author?.id && shouldRefreshAvatar()) {
      const latestImage = getLatestProfileImage(post.author.id, avatar);
      if (latestImage !== "/placeholder.svg") {
        return latestImage;
      }
    }
    
    if (avatar.startsWith("http")) return avatar;
    return "/placeholder.svg";
  };

  // Helper to get all media for the post
  const getMedia = () => {
    // Support both single media (string) and multiple media (array)
    if (Array.isArray(post.images) && post.images.length > 0) {
      // Handle new format where images can be objects with url and type
      return post.images.map((item: any) => {
        if (typeof item === 'string') {
          return { url: item, type: 'image' };
        }
        return item;
      });
    }
    if (typeof post.images === 'string') {
      try {
        const arr = JSON.parse(post.images);
        if (Array.isArray(arr)) {
          return arr.map((item: any) => {
            if (typeof item === 'string') {
              return { url: item, type: 'image' };
            }
            return item;
          });
        }
      } catch {}
    }
    if (post.image) return [{ url: post.image, type: 'image' }];
    if (post.media_url) return [{ url: post.media_url, type: post.media_type || 'image' }];
    return [];
  };

  // Helper to check if a media item is a video
  const isVideo = (mediaItem: any) => {
    if (typeof mediaItem === 'string') {
      const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.wmv', '.flv', '.3gp'];
      const lowerUrl = mediaItem.toLowerCase();
      return videoExtensions.some(ext => lowerUrl.includes(ext)) || 
             lowerUrl.includes('video/') ||
             lowerUrl.includes('blob:') && post.media_type === 'video';
    }
    return mediaItem.type === 'video';
  };
  const media = getMedia();

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

  return (
    <div
      className={
        variant === 'grid'
          ? 'bg-card border border-border rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow'
          : 'bg-card border border-border rounded-lg shadow-sm overflow-hidden'
      }
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
                className="trofify-profile-name cursor-pointer hover:underline"
                onClick={handleProfileClick}
              >
                {post.author.name}
              </span>
              {!isOwnPost && <span className="text-white text-xs">⦿</span>}
              {post.author.verified && (
                <div className="w-4 h-4 bg-[#0e9591] rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
              {!isOwnPost && (
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
              <div className="flex items-center space-x-1">
                <span className="trofify-time">{post.timeAgo}</span>
              </div>
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
        <div
          className={
            variant === 'grid'
              ? 'trofify-caption mb-2 line-clamp-2 cursor-pointer'
              : 'trofify-caption mb-4 px-4 lg:px-6 cursor-pointer hover:bg-muted/50 transition-colors'
          }
          onClick={() => onPostClick && onPostClick(post)}
        >
          <TaggedUsersRenderer
            text={post.content || post.description || ""}
            taggedUsers={post.tagged_users || []}
            onUserClick={onProfileClick}
            className="whitespace-pre-wrap break-words"
          />
        </div>
        {media.length > 1 ? (
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
                {media.map((mediaItem: any, idx: number) => (
                  <CarouselItem key={idx}>
                    <div 
                      className={
                        variant === 'grid'
                          ? 'w-full aspect-square bg-gray-100 rounded-md mb-2 cursor-pointer hover:opacity-90 transition-opacity overflow-hidden'
                          : 'w-full aspect-square bg-gray-100 rounded-none lg:rounded-lg m-0 cursor-pointer hover:opacity-90 transition-opacity overflow-hidden'
                      }
                      onClick={() => onPostClick && onPostClick(post)}
                    >
                      {isVideo(mediaItem) ? (
                        <video
                          src={mediaItem.url}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                          preload="metadata"
                        />
                      ) : (
                        <img
                          src={mediaItem.url}
                          alt={`Post media ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
            {/* Pagination dots */}
            <div className="flex justify-center mt-2 space-x-1">
              {media.map((_, idx) => (
                <span
                  key={idx}
                  className={`inline-block w-2 h-2 rounded-full transition-all duration-200 ${idx === currentIndex ? 'bg-[#0e9591]' : 'bg-muted-foreground/30'}`}
                />
              ))}
            </div>
          </div>
        ) : media.length === 1 ? (
          <div 
            className={
              variant === 'grid'
                ? 'w-full aspect-square bg-gray-100 rounded-md mb-2 cursor-pointer hover:opacity-90 transition-opacity overflow-hidden'
                : 'w-full aspect-square bg-gray-100 rounded-none lg:rounded-lg m-0 cursor-pointer hover:opacity-90 transition-opacity overflow-hidden'
            }
            onClick={() => onPostClick && onPostClick(post)}
          >
            {isVideo(media[0]) ? (
              <video
                src={media[0].url}
                className="w-full h-full object-cover"
                muted
                playsInline
                preload="metadata"
                controls
              />
            ) : (
              <img
                src={media[0].url}
                alt="Post content"
                className="w-full h-full object-cover"
              />
            )}
          </div>
        ) : null}

        {/* Post Actions */}
        {variant !== 'grid' && (
          <PostActions
            postId={Number(post.id)}
            userId={userId}
            initialLikes={post.likes || 0}
            initialComments={post.comments || 0}
            initialShares={post.shares || 0}
            initialSaved={isSaved}
            initialLiked={post.isLiked || false}
            onProfileClick={onProfileClick}
            isOwner={isOwnPost}
            onDelete={onDelete ? (postId: number) => onDelete(String(postId)) : undefined}
            onSaveChange={onSaveChange}
          />
        )}
      </div>
    </div>
  );
};
