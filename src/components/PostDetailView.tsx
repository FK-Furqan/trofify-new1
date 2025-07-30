import { useState, useEffect } from "react";
import { ArrowLeft, Heart, MessageCircle, Share, Bookmark, MoreHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toProperCase } from "@/lib/utils";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { CommentModal } from "./CommentModal";
import axios from "axios";
import { toast } from "@/components/ui/use-toast";
import { getBackendUrl, formatTimestamp } from "@/lib/utils";
import { SupportService } from "@/lib/supportService";

interface PostDetailViewProps {
  post: any;
  onBack: () => void;
  userId: string;
  onProfileClick?: (profile: any) => void;
  onSaveChange?: () => void;
}

export const PostDetailView = ({ post, onBack, userId, onProfileClick, onSaveChange }: PostDetailViewProps) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState(0);
  const [shares, setShares] = useState(0);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [likeUsers, setLikeUsers] = useState<any[]>([]);
  const [shareUsers, setShareUsers] = useState<any[]>([]);
  const [saveUsers, setSaveUsers] = useState<any[]>([]);
  const [commentUsers, setCommentUsers] = useState<any[]>([]);
  const [actionsLoading, setActionsLoading] = useState(true);
  const [isSupporting, setIsSupporting] = useState(false);
  const [supportLoading, setSupportLoading] = useState(false);


  const fetchActionCounts = async () => {
    setActionsLoading(true);
    try {
      const res = await axios.get(`${getBackendUrl()}/api/posts/${post.id}/actions`);
      setLikeUsers(res.data.likes || []);
      setShareUsers(res.data.shares || []);
      setSaveUsers(res.data.saves || []);
      setCommentUsers(res.data.comments || []);
      setLikes((res.data.likes || []).length);
      setComments((res.data.comments || []).length);
      setShares((res.data.shares || []).length);
      // Check if current user has liked this post
      const userLiked = (res.data.likes || []).some((user: any) => user.id === userId);
      setLiked(userLiked);
      // Check if current user has saved this post
      const userSaved = (res.data.saves || []).some((user: any) => user.id === userId);
      setSaved(userSaved);
    } catch (err) {
      console.error('Failed to fetch post actions:', err);
    } finally {
      setActionsLoading(false);
    }
  };

  useEffect(() => {
    fetchActionCounts();
  }, [post.id, userId]);

  // Listen for save changes from other components
  useEffect(() => {
    const handlePostSaveChange = (event: CustomEvent) => {
      if (event.detail.postId === post.id && event.detail.userId === userId) {
        setSaved(event.detail.saved);
      }
    };

    window.addEventListener('postSaveChange', handlePostSaveChange as EventListener);
    
    return () => {
      window.removeEventListener('postSaveChange', handlePostSaveChange as EventListener);
    };
  }, [post.id, userId]);

  const handleLike = async () => {
    try {
      if (!liked) {
        await axios.post(`${getBackendUrl()}/api/posts/${post.id}/like`, { userId });
      } else {
        await axios.delete(`${getBackendUrl()}/api/posts/${post.id}/like`, { data: { userId } });
      }
      await fetchActionCounts();
    } catch (err) {
      console.error('Failed to like/unlike post:', err);
    }
  };

  const handleSave = async () => {
    try {
      if (!saved) {
        await axios.post(`${getBackendUrl()}/api/posts/${post.id}/save`, { userId });
        toast({ title: "Post saved", description: "This post was added to your Saved Posts." });
      } else {
        await axios.delete(`${getBackendUrl()}/api/posts/${post.id}/save`, { data: { userId } });
        toast({ title: "Post unsaved", description: "This post was removed from your Saved Posts." });
      }
      setSaved(!saved);
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('postSaveChange', { 
        detail: { postId: post.id, saved: !saved, userId } 
      }));
      
      if (onSaveChange) onSaveChange();
      await fetchActionCounts();
    } catch (err) {
      console.error('Failed to save/unsave post:', err);
      toast({ title: "Error", description: "Failed to save/unsave post.", variant: "destructive" });
    }
  };

  const handleShare = async () => {
    try {
      await axios.post(`${getBackendUrl()}/api/posts/${post.id}/share`, { userId });
      await fetchActionCounts();
      toast({ title: "Post shared", description: "Post has been shared successfully." });
    } catch (err) {
      console.error('Failed to share post:', err);
    }
  };

  const handleProfileClick = async () => {
    if (onProfileClick) {
      try {
        // Fetch complete user profile data from backend
        const response = await fetch(`${getBackendUrl()}/api/users/${post.user_id}`);
        if (response.ok) {
          const completeProfile = await response.json();
          onProfileClick(completeProfile);
        } else {
          console.error('Failed to fetch complete profile, using fallback');
          // Fallback to basic profile data if fetch fails
          onProfileClick({
            id: post.user_id,
            name: post.author_name || post.display_name,
            display_name: post.author_name || post.display_name,
            username: `@${(post.author_name || post.display_name || post.email)?.toLowerCase().replace(/\s+/g, '')}`,
            avatar: post.avatar || "/placeholder.svg",
            sport: post.category || post.user_type,
            user_type: post.category || post.user_type,
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
      } catch (error) {
        console.error('Error fetching complete profile:', error);
        // Fallback to basic profile data if fetch fails
        onProfileClick({
          id: post.user_id,
          name: post.author_name || post.display_name,
          display_name: post.author_name || post.display_name,
          username: `@${(post.author_name || post.display_name || post.email)?.toLowerCase().replace(/\s+/g, '')}`,
          avatar: post.avatar || "/placeholder.svg",
          sport: post.category || post.user_type,
          user_type: post.category || post.user_type,
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
    }
  };

  // Handle support/un-support
  const handleSupportClick = async () => {
    if (!userId || !post.author_id || userId === post.author_id || supportLoading) {
      return;
    }

    setSupportLoading(true);
    try {
      const result = await SupportService.toggleSupport(userId, post.author_id);
      setIsSupporting(result.action === 'supported');

      if (result.action === 'supported') {
        toast({
          title: "Support Added",
          description: `You are now supporting ${post.author_name || post.display_name}`,
          variant: "success"
        });
      } else {
        toast({
          title: "Support Removed",
          description: `You are no longer supporting ${post.author_name || post.display_name}`,
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
      if (!userId || !post.author_id || userId === post.author_id) {
        return;
      }

      try {
        const supporting = await SupportService.isSupporting(userId, post.author_id);
        setIsSupporting(supporting);
      } catch (error) {
        console.error('Error checking support status:', error);
      }
    };

    checkSupportStatus();
  }, [userId, post.author_id]);

  // Helper to get the correct avatar URL
  const getAvatarUrl = (avatar?: string) => {
    if (!avatar) return "/placeholder.svg";
    if (avatar.startsWith("http")) return avatar;
    return "/placeholder.svg";
  };

  // Helper to get the correct media URL
  const getMediaUrl = (mediaUrl?: string) => {
    if (!mediaUrl) return "/placeholder.svg";
    if (mediaUrl.startsWith("http")) return mediaUrl;
    return "/placeholder.svg";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-2 hover:bg-muted rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <span className="font-semibold text-lg text-foreground">Post</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleShare}>Share</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(window.location.href)}>
                Copy Link
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Post Content - Scrollable Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-2xl mx-auto bg-card">
          {/* Post Header */}
          <div className="flex items-center justify-between p-4 border-b-4 border-border">
            <div className="flex items-center space-x-3">
              <Avatar
                className="h-12 w-12 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                onClick={handleProfileClick}
              >
                <AvatarImage src={getAvatarUrl(post.avatar)} />
                <AvatarFallback>
                  {(post.author_name || post.display_name || post.email || "U")[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-2">
                  <span
                    className="font-semibold text-foreground cursor-pointer hover:underline"
                    onClick={handleProfileClick}
                  >
                    {post.author_name || post.display_name || post.email || "Unknown User"}
                  </span>
                  {userId !== post.author_id && <span className="text-white text-xs">⦿</span>}
                  {userId !== post.author_id && (
                    <>
                      <div className="w-0.5"></div> {/* 2px gap */}
                      <span
                        className={`font-semibold font-bold cursor-pointer hover:underline transition-all duration-200 hover:opacity-80 text-sm ${
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
                {post.sport && (
                  <Badge variant="secondary" className="text-xs bg-gray-600 text-white w-fit flex items-center justify-center">
                    {toProperCase(post.sport)}
                  </Badge>
                )}
                {(post.category || post.user_type) && (
                  <Badge variant="secondary" className="text-xs bg-[#0e9591] text-white w-fit flex items-center justify-center">
                    {toProperCase(post.category || post.user_type)}
                  </Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {formatTimestamp(post.created_at)}
              </div>
            </div>
              </div>
            </div>
          </div>

          {/* Post Description */}
          <div className="p-4 border-b-4 border-border">
            <p className="text-foreground text-base leading-relaxed">
              {post.description || post.content || "No description"}
            </p>
          </div>

          {/* Post Media */}
          {(post.media_url || post.image || post.images) && (
            <div className="border-b-4 border-border">
              {post.media_type === 'video' ? (
                <video
                  src={getMediaUrl(post.media_url)}
                  controls
                  className="w-full object-cover"
                  style={{ maxHeight: '60vh' }}
                />
              ) : (
                <img
                  src={getMediaUrl(post.image || (post.images && post.images.length > 0 ? post.images[0] : post.media_url))}
                  alt="Post content"
                  className="w-full object-cover"
                  style={{ maxHeight: '60vh' }}
                />
              )}
            </div>
          )}

          {/* Post Actions */}
          <div className="p-4 border-b-4 border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {actionsLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="animate-spin h-5 w-5 text-[#0e9591]" />
                    <span className="text-muted-foreground text-sm">Loading...</span>
                  </div>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLike}
                      className={`px-4 py-2 transform -skew-x-12 ${liked ? "bg-red-500/20 text-red-500" : "bg-red-500/10 text-red-500 hover:bg-red-500/20"}`}
                    >
                      <div className="transform skew-x-12 flex items-center">
                        <Heart className={`h-4 w-4 mr-2 ${liked ? "fill-red-500 stroke-red-500" : "stroke-red-500"}`} />
                        {likes}
                      </div>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCommentModalOpen(true)}
                      className="px-4 py-2 transform -skew-x-12 bg-[#0e9591]/10 text-[#0e9591] hover:bg-[#0e9591]/20"
                    >
                      <div className="transform skew-x-12 flex items-center">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        {comments}
                      </div>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleShare}
                      className="px-4 py-2 transform -skew-x-12 bg-[#0e9591]/10 text-[#0e9591] hover:bg-[#0e9591]/20"
                    >
                      <div className="transform skew-x-12 flex items-center">
                        <Share className="h-4 w-4 mr-2" />
                        {shares}
                      </div>
                    </Button>
                  </>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                className={saved ? "text-[#0e9591] bg-[#0e9591]/20" : "text-muted-foreground"}
              >
                <Bookmark
                  className={`h-5 w-5 transition-colors duration-150 ${saved ? "fill-[#0e9591] stroke-[#0e9591]" : "stroke-[#0e9591]"}`}
                />
              </Button>
            </div>
          </div>

          {/* Comments Preview */}
          <div className="p-4">
            <div className="text-sm text-muted-foreground mb-3">
              {comments} comment{comments !== 1 ? 's' : ''}
            </div>
            {commentUsers.slice(0, 3).map((comment, index) => (
              <div key={index} className="flex items-start space-x-3 mb-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={getAvatarUrl(comment.users?.avatar || comment.avatar)} />
                  <AvatarFallback>
                    {(comment.users?.display_name || comment.users?.email || comment.display_name || comment.email || "U")[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="bg-muted rounded-lg p-3">
                    <div className="font-semibold text-sm text-foreground">
                      {comment.users?.display_name || comment.users?.email || comment.display_name || comment.email}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {comment.comment}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {comments > 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCommentModalOpen(true)}
                className="text-[#0e9591] hover:text-[#087a74]"
              >
                View all {comments} comments
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Comment Modal */}
      <CommentModal
        open={commentModalOpen}
        onOpenChange={setCommentModalOpen}
        postId={String(post.id)}
        userId={String(userId)}
        onCommentAdded={() => setComments(c => c + 1)}
        onCommentDeleted={() => setComments(c => c - 1)}
        onProfileClick={onProfileClick}
      />
    </div>
  );
}; 