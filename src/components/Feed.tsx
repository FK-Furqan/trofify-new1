
import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { PostCard } from "./PostCard";
import { CreatePost } from "./CreatePost";
import { getBackendUrl } from "@/lib/utils";

interface FeedProps {
  onProfileClick?: (profile: any) => void;
  userId: string;
  onSaveChange?: () => void;
  onLoadingComplete?: () => void;
}

function formatTimeAgo(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d`;
  
  // After 24 hours, show the actual date
  return date.toLocaleDateString();
}

const FeedComponent = ({ onProfileClick, userId, onSaveChange, onLoadingComplete }: FeedProps) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${getBackendUrl()}/api/posts`);
      if (!res.ok) throw new Error("Failed to fetch posts");
      const data = await res.json();
      
      // Map API data to PostCard structure
      const mapped = data.map((post: any) => {
        // Get user info from the joined users table
        const user = post.users || {};
        
        console.log("Feed: Processing post:", {
          postId: post.id,
          user: user,
          userAvatar: user.avatar,
          userDisplayName: user.display_name,
          userEmail: user.email
        });
        
        return {
          id: post.id,
          author: {
            name: user.display_name || user.email || "Unknown User",
            username: user.email ? `@${user.email.split("@")[0]}` : "@unknown",
            avatar: user.avatar || "/placeholder.svg",
            sport: post.user_type || "athlete",
            verified: false,
            id: post.user_id,
            profile: user,
          },
          content: post.description || "",
          image: post.media_url || "", // Supabase Storage URLs are already full URLs
          video: post.media_type === 'video' ? post.media_url : null,
          likes: 0, // Will be populated from post_likes count
          comments: 0, // Will be populated from post_comments count
          shares: 0,
          timeAgo: post.created_at ? formatTimeAgo(post.created_at) : "",
          isLiked: false, // TODO: Check if current user liked this post
          isSaved: false, // TODO: Check if current user saved this post
        };
      });
      
      setPosts(mapped);
    } catch (err: any) {
      setError(err.message || "Failed to load posts");
      console.error("Failed to fetch posts:", err);
    } finally {
      setLoading(false);
      if (onLoadingComplete) onLoadingComplete();
    }
  }, [onLoadingComplete]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const memoizedPosts = useMemo(() => posts, [posts]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-lg p-4 animate-pulse">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-muted rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-24 mb-1"></div>
                <div className="h-3 bg-muted rounded w-16"></div>
              </div>
            </div>
            <div className="h-4 bg-muted rounded w-full mb-2"></div>
            <div className="h-40 bg-muted rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-8">
        <p>{error}</p>
        <button 
          onClick={fetchPosts}
          className="mt-2 px-4 py-2 bg-[#0e9591] text-white rounded hover:bg-[#0c7b77]"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (memoizedPosts.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>No posts yet. Be the first to share something!</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-0">
      {memoizedPosts.map((post) => (
        <PostCard 
          key={post.id} 
          post={post} 
          onProfileClick={onProfileClick} 
          showTopMenu={false} 
          userId={userId} 
          onSaveChange={onSaveChange} 
          isSaved={post.isSaved}
          onPostClick={(post) => {
            console.log('Post clicked from feed:', post);
          }}
        />
      ))}
    </div>
  );
};

export const Feed = memo(FeedComponent);
