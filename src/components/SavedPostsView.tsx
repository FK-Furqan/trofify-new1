import { Bookmark, Trash2, Share, MoreHorizontal, Grid, List, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { PostDetailView } from "./PostDetailView";
import { PostCard } from "./PostCard";
import axios from "axios";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { getBackendUrl } from "@/lib/utils";

interface SavedPostsViewProps {
  onProfileClick?: (profile: any) => void;
  userId?: string;
}

export const SavedPostsView = ({ onProfileClick, userId }: SavedPostsViewProps) => {
  const [selectedPost, setSelectedPost] = useState<any>(null);
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

  // Handle back from post detail view
  const handleBackFromPost = () => {
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
  };

  // Helper to get the correct avatar URL
  const getAvatarUrl = (avatar?: string) => {
    if (!avatar) return "/placeholder.svg";
    if (avatar.startsWith("http")) return avatar;
    return avatar; // Already a full URL or handled by backend
  };

  if (loading) {
    return (
      <div className="w-full lg:px-4 lg:max-w-4xl lg:mx-auto px-0 mx-0">
        <div className="w-full max-w-md mx-auto bg-card min-h-screen flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0e9591]"></div>
            <p className="text-muted-foreground">Loading saved posts...</p>
          </div>
        </div>
      </div>
    );
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

  // Show post detail view if a post is selected
  if (selectedPost) {
    return (
      <PostDetailView
        post={selectedPost}
        onBack={handleBackFromPost}
        userId={userId || ""}
        onProfileClick={onProfileClick}
        onSaveChange={handleSaveChange}
      />
    );
  }

  return (
    <div className="w-full lg:px-4 lg:max-w-4xl lg:mx-auto px-0 mx-0">
      <div className={`${viewMode === 'list' ? 'w-full' : 'w-full max-w-md mx-auto'} bg-card min-h-screen`}>
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-foreground">Saved Posts</h1>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-[#0e9591] text-white' : ''}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-[#0e9591] text-white' : ''}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className={viewMode === 'list' ? 'p-0' : 'p-4'}>
          {savedPosts.length === 0 ? (
            <div className="text-center py-12">
              <Bookmark className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No saved posts yet</h3>
              <p className="text-muted-foreground text-center">Posts you save will appear here</p>
            </div>
          ) : viewMode === 'list' ? (
            // List view - Full screen like home page
            <div className="space-y-0">
              {savedPosts.map((post) => {
                // Transform saved post data to match PostCard format
                const transformedPost = {
                  id: post.id,
                  author: {
                    name: post.author_name ? post.author_name : (post.email || 'Unknown'),
                    username: post.author_name ? `@${post.author_name.toLowerCase().replace(/\s+/g, '')}` : post.email,
                    avatar: post.users?.avatar || post.avatar || "/placeholder.svg",
                    sport: post.category || post.user_type,
                    verified: false,
                    id: post.user_id,
                    profile: post.users || null,
                  },
                  content: post.description || post.content,
                  image: post.image || post.media_url || "",
                  likes: post.likes || 0,
                  comments: post.comments || 0,
                  shares: post.shares || 0,
                  timeAgo: post.created_at ? formatDate(post.created_at) : "",
                  category: post.category || post.user_type,
                };

                return (
                  <div key={post.id} className="border-b-2 border-border">
                    <PostCard
                      post={transformedPost}
                      onProfileClick={handleProfileClick}
                      showTopMenu={false}
                      userId={userId || ""}
                      onSaveChange={handleSaveChange}
                      onPostClick={handlePostClick}
                      isSaved={true} // Indicate this is a saved post
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            // Grid view - Compact cards
            <div className="grid grid-cols-2 gap-4">
              {savedPosts.map((post) => (
                <div
                  key={post.id}
                  className="border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col"
                  onClick={() => handlePostClick(post)}
                >
                  {(post.image || post.media_url) && (
                    <img
                      src={post.image || `https://trofify-media.s3.amazonaws.com/${post.media_url}`}
                      alt="Post content"
                      className="w-full object-cover h-32"
                    />
                  )}
                  {!post.image && !post.media_url && (
                    <div className="w-full bg-muted flex items-center justify-center h-32">
                      <span className="text-muted-foreground text-2xl">📄</span>
                    </div>
                  )}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-center space-x-2 mb-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={getAvatarUrl(post.avatar)} />
                        <AvatarFallback>{(post.author_name || post.email || "U")[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground truncate">{post.author_name || post.email}</div>
                        <div className="text-xs text-muted-foreground truncate">{post.category || post.user_type}</div>
                      </div>
                    </div>
                    
                    <p className="text-foreground text-sm mb-3 line-clamp-2">
                      {post.description || post.content}
                    </p>
                    
                    <div className="flex items-center justify-between mt-auto">
                      <Badge variant="secondary" className="text-xs bg-[#0e9591] text-white">
                        {post.category || post.user_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Recently'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>❤️ {post.likes || 0}</span>
                        <span>💬 {post.comments || 0}</span>
                      </div>
                      <button 
                        className="p-2 text-muted-foreground hover:text-foreground saved-post-menu" 
                        onClick={e => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
