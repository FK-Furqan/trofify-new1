import { Bookmark, Trash2, Share, MoreHorizontal, Grid, List, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { PostModal } from "./PostModal";
import { PostCard } from "./PostCard";
import axios from "axios";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { getBackendUrl } from "@/lib/utils";
import { UniversalLoader } from "@/components/ui/universal-loader";

interface SavedPostsViewProps {
  onProfileClick?: (profile: any) => void;
  userId?: string;
}

export const SavedPostsView = ({ onProfileClick, userId }: SavedPostsViewProps) => {
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list'); // Add view mode state

  // Fetch saved posts from API
  const fetchSavedPosts = async () => {
    if (!userId) {
      setError("User ID is required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${getBackendUrl()}/api/users/${userId}/saved-posts`);
      console.log('Saved posts response:', response.data);
      setSavedPosts(response.data);
      setError("");
    } catch (err) {
      console.error('Failed to fetch saved posts:', err);
      setError("Failed to load saved posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedPosts();
  }, [userId]);

  // Handle unsave post
  const handleUnsavePost = async (postId: number) => {
    try {
      await axios.delete(`${getBackendUrl()}/api/posts/${postId}/save`, { 
        data: { userId } 
      });
      toast({ title: "Post unsaved", description: "Post removed from saved items." });
      // Remove from local state
      setSavedPosts(prev => prev.filter(post => post.id !== postId));
    } catch (err) {
      console.error('Failed to unsave post:', err);
      toast({ title: "Error", description: "Failed to unsave post.", variant: "destructive" });
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
  };

  const handleProfileClick = (post: any) => {
    if (onProfileClick) {
      onProfileClick({
        id: post.user_id,
        name: post.author_name,
        username: `@${post.author_name?.toLowerCase().replace(/\s+/g, '')}`,
        avatar: post.avatar || "/placeholder.svg",
        sport: post.category,
        verified: false,
        bio: `Professional ${post.category || post.user_type} User`,
        coverImage: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&h=400&fit=crop",
        location: "New York, USA",
        joinDate: "March 2022",
        followers: Math.floor(Math.random() * 50000) + 10000,
        following: Math.floor(Math.random() * 1000) + 100,
        posts: Math.floor(Math.random() * 200) + 50,
      });
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
  };

  // Handle save changes
  const handleSaveChange = () => {
    // Refresh saved posts when a post is saved/unsaved
    fetchSavedPosts();
  };

  // Toggle view mode
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'list' ? 'grid' : 'list');
  };

  const handlePostClick = (post: any) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  // Helper to get the correct avatar URL
  const getAvatarUrl = (avatar?: string) => {
    if (!avatar) return "/placeholder.svg";
    if (avatar.startsWith("http")) return avatar;
    return avatar; // Already a full URL or handled by backend
  };

  if (loading) {
    return <UniversalLoader />;
  }

  if (error) {
    return (
      <div className="w-full lg:px-4 lg:max-w-4xl lg:mx-auto px-0 mx-0">
        <div className="w-full max-w-md mx-auto bg-card min-h-screen flex items-center justify-center">
          <p className="text-destructive">Error: {error}</p>
        </div>
      </div>
    );
  }

  // Unified post layout (like Feed)
  return (
    <>
      <div className="w-full space-y-0">
          {savedPosts.length === 0 ? (
            <div className="text-center py-12">
              <Bookmark className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No saved posts yet</h3>
              <p className="text-muted-foreground text-center">Posts you save will appear here</p>
            </div>
      ) : (
        savedPosts.map((post) => {
                // Transform saved post data to match PostCard format
                const transformedPost = {
                  id: post.id,
                  author: {
                    name: post.author_name ? post.author_name : (post.email || 'Unknown'),
                    username: post.author_name ? `@${post.author_name.toLowerCase().replace(/\s+/g, '')}` : post.email,
                    avatar: post.avatar || "/placeholder.svg",
                    sport: post.category || post.user_type,
                    verified: false,
                    id: post.user_id,
                    profile: null,
                  },
                  content: post.description || post.content,
                  image: (post.images && post.images.length > 0) ? post.images[0] : (post.image || post.media_url || ""),
                  images: post.images || [], // Add images array for PostCard
                  likes: post.likes || 0,
                  comments: post.comments || 0,
                  shares: post.shares || 0,
                  timeAgo: post.created_at ? formatDate(post.created_at) : "",
                  category: post.category || post.user_type,
                  isLiked: post.isLiked || false,
                  isSaved: post.isSaved || true,
                };
                return (
                    <PostCard
                      key={post.id}
                      post={transformedPost}
                      onProfileClick={handleProfileClick}
                      showTopMenu={false}
                      userId={userId || ""}
                      onSaveChange={handleSaveChange}
                      onPostClick={handlePostClick}
                      isSaved={transformedPost.isSaved}
                    />
          );
        })
      )}
                    </div>
                    
      {selectedPost && (
        <PostModal
          post={selectedPost}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          userId={userId || ""}
          onProfileClick={onProfileClick}
          onSaveChange={handleSaveChange}
        />
      )}
    </>
  );
};
