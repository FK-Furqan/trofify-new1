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

  const handleProfileClick = () => {
    if (onProfileClick) {
      // Use the full profile object if available, otherwise create a basic one
      if (post.author.profile) {
        console.log("PostCard: Using full profile object:", post.author.profile);
        onProfileClick(post.author.profile);
      } else {
        // Fallback to basic profile data with proper structure
        const fallbackProfile = {
          id: post.author.id, // This is the crucial field for fetching posts
          name: post.author.name,
          display_name: post.author.name, // Add display_name for consistency
          email: post.author.username.replace('@', ''), // Extract email from username
          avatar: post.author.avatar,
          sport: post.author.sport,
          user_type: post.author.sport, // Map sport to user_type
          // Add other fields that ProfileView expects
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
    return `https://trofify-media.s3.amazonaws.com/${avatar}`;
  };

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
        {post.image && (
          <img
            src={post.image}
            alt="Post content"
            className={
              variant === 'grid'
                ? 'w-full h-40 object-cover rounded-md mb-2 cursor-pointer hover:opacity-90 transition-opacity'
                : 'w-full h-48 object-cover rounded-none lg:rounded-lg m-0 cursor-pointer hover:opacity-90 transition-opacity'
            }
            style={variant === 'grid' ? { minHeight: 120, maxHeight: 180 } : {}}
            onClick={() => onPostClick && onPostClick(post)}
          />
        )}
      </div>

      {/* Actions */}
      <div className={variant === 'grid' ? 'mt-auto' : ''}>
        <PostActions
          postId={post.id}
          userId={userId}
          initialLikes={post.likes}
          initialComments={post.comments}
          initialShares={post.shares}
          initialSaved={isSaved}
          onProfileClick={onProfileClick}
          onSaveChange={onSaveChange}
        />
      </div>
    </div>
  );
};
