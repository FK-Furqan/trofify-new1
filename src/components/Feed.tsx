
import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { PostCard } from "./PostCard";
import { PostModal } from "./PostModal";
import { CreatePost } from "./CreatePost";
import { getBackendUrl, formatTimestamp } from "@/lib/utils";
import { UniversalLoader } from "@/components/ui/universal-loader";

interface FeedProps {
  onProfileClick?: (profile: any) => void;
  userId: string;
  onSaveChange?: () => void;
  onLoadingComplete?: () => void;
}



const FeedComponent = ({ onProfileClick, userId, onSaveChange, onLoadingComplete }: FeedProps) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${getBackendUrl()}/api/posts?user_id=${userId}`);
      if (!res.ok) throw new Error("Failed to fetch posts");
      const data = await res.json();
      
      // Map API data to PostCard structure
      const mapped = data.map((post: any) => {
        // Get user info from the joined users table
        const user = post.users || {};
        // Parse images array if present and stringified
        let images = [];
        if (Array.isArray(post.images)) {
          images = post.images;
        } else if (typeof post.images === 'string') {
          try {
            images = JSON.parse(post.images);
          } catch {}
        }
        return {
          id: post.id,
          author: {
            name: user.display_name || user.email || "Unknown User",
            username: user.email ? `@${user.email.split("@")[0]}` : "@unknown",
            avatar: user.avatar || "/placeholder.svg",
            sport: user.user_type || post.user_type, // Show user type (athlete, coach, etc.)
            userSport: user.sport, // Actual sport for filtering/search if needed
            verified: false,
            id: post.user_id,
            profile: user,
          },
          content: post.description || "",
          image: (images.length > 0) ? images[0] : (post.media_url || ""),
          images: images.length > 0 ? images : undefined,
          video: post.media_type === 'video' ? post.media_url : null,
          likes: post.likes_count || 0, // Use backend count if available
          comments: post.comments_count || 0, // Use backend count if available
          shares: post.shares_count || 0,
          timeAgo: post.created_at ? formatTimestamp(post.created_at) : "",
          isLiked: !!post.isLiked, // Use backend value for like state
          isSaved: !!post.isSaved, // Use backend value for save state
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
  }, [onLoadingComplete, userId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const memoizedPosts = useMemo(() => posts, [posts]);

  if (loading) {
    return <UniversalLoader />;
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

  const handlePostClick = (post: any) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
  };

  return (
    <>
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
            onPostClick={handlePostClick}
          />
        ))}
      </div>
      
      {selectedPost && (
        <PostModal
          post={selectedPost}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          userId={userId}
          onProfileClick={onProfileClick}
          onSaveChange={onSaveChange}
        />
      )}
    </>
  );
};

export const Feed = memo(FeedComponent);
