import { useState, useEffect } from "react";
import { Heart, MessageCircle, Share, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { CommentModal } from "./CommentModal";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { getBackendUrl } from "@/lib/utils";

interface PostActionsProps {
  postId: number;
  userId: string;
  initialLikes: number;
  initialComments: number;
  initialShares: number;
  initialSaved: boolean;
  initialLiked?: boolean;
  onProfileClick?: (profile: any) => void;
  isOwner?: boolean; // Pass this prop from parent
  onDelete?: (postId: number) => void; // Callback to remove post from UI
  onSaveChange?: () => void; // Callback to refresh saved posts
}

export const PostActions = ({
  postId,
  userId,
  initialLikes,
  initialComments,
  initialShares,
  initialSaved,
  initialLiked = false,
  onProfileClick,
  isOwner,
  onDelete,
  onSaveChange,
}: PostActionsProps) => {
  const [liked, setLiked] = useState(initialLiked);
  const [saved, setSaved] = useState(initialSaved);
  const [likes, setLikes] = useState(initialLikes);
  const [comments, setComments] = useState(initialComments);
  const [shares, setShares] = useState(initialShares);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [likeUsers, setLikeUsers] = useState<any[]>([]);
  const [shareUsers, setShareUsers] = useState<any[]>([]);
  const [saveUsers, setSaveUsers] = useState<any[]>([]);
  const [commentUsers, setCommentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isValidUUID = (id: string) => typeof id === 'string' && /^[0-9a-fA-F-]{36}$/.test(id);

  // --- PostActions: Handles like, comment, save, and share actions for a post. All actions update counts in real time. ---
  // Fetches all action counts (likes, comments, shares, saves) and updates local state. Called after every action.
  const fetchActionCounts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${getBackendUrl()}/api/posts/${postId}/actions`);
      setLikeUsers(res.data.likes || []);
      setShareUsers(res.data.shares || []);
      setSaveUsers(res.data.saves || []);
      setCommentUsers(res.data.comments || []);
      setLikes((res.data.likes || []).length);
      setComments((res.data.comments || []).length);
      setShares((res.data.shares || []).length);
      // Check if current user has liked this post
      const userLiked = (res.data.likes || []).some((user: any) => String(user.id) === String(userId));
      setLiked(userLiked);
      // Check if current user has saved this post
      const userSaved = (res.data.saves || []).some((user: any) => user.id?.toString() === userId?.toString());
      setSaved(userSaved);
    } catch (err) { console.error('Failed to fetch action counts:', err); }
    setLoading(false);
  };

  useEffect(() => {
    // Set initial states from props
    setLiked(initialLiked);
    setSaved(initialSaved);
    setLikes(initialLikes);
    setComments(initialComments);
    setShares(initialShares);
    
    // Set loading to false since we have initial data
    setLoading(false);
    // eslint-disable-next-line
  }, [postId, userId, initialLiked, initialSaved, initialLikes, initialComments, initialShares]);

  // Listen for save changes from other components
  useEffect(() => {
    const handlePostSaveChange = (event: CustomEvent) => {
      if (event.detail.postId === postId && event.detail.userId.toString() === userId.toString()) {
        setSaved(event.detail.saved);
      }
    };

    window.addEventListener('postSaveChange', handlePostSaveChange as EventListener);
    
    return () => {
      window.removeEventListener('postSaveChange', handlePostSaveChange as EventListener);
    };
  }, [postId, userId]);

  // Like/unlike handler: toggles like state and updates count
  const handleLike = async () => {
    if (!isValidUUID(userId)) {
      toast({ title: "Error", description: "You must be logged in to like posts.", variant: "destructive" });
      console.warn('Like action blocked: invalid userId', userId);
      return;
    }
    console.log('Liking/unliking post', postId, 'as user', userId);
    if (!liked) {
      setLiked(true);
      setLikes(l => l + 1);
      try {
        const res = await axios.post(`${getBackendUrl()}/api/posts/${postId}/like`, { user_id: userId });
        if (res.status !== 200) throw new Error('Failed to like');
      } catch (e) {
        setLiked(false);
        setLikes(l => (l > 0 ? l - 1 : 0));
        toast({ title: "Error", description: "Failed to like post.", variant: "destructive" });
        console.error('Like/unlike failed:', e);
      }
    } else {
      setLiked(false);
      setLikes(l => (l > 0 ? l - 1 : 0));
      try {
        const res = await axios.delete(`${getBackendUrl()}/api/posts/${postId}/like`, { data: { user_id: userId } });
        if (res.status !== 200) throw new Error('Failed to unlike');
      } catch (e) {
        setLiked(true);
        setLikes(l => l + 1);
        toast({ title: "Error", description: "Failed to unlike post.", variant: "destructive" });
        console.error('Like/unlike failed:', e);
      }
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await axios.delete(`${getBackendUrl()}/api/posts/${postId}`, { data: { userId } });
      toast({ title: "Post deleted", description: "Your post has been deleted." });
      if (onDelete) onDelete(postId);
    } catch (err) {
      toast({ title: "Delete failed", description: "Could not delete post.", variant: "destructive" });
    }
  };

  // Save/unsave handler: toggles save state and updates count
  const handleSave = async () => {
    if (!isValidUUID(userId)) {
      toast({ title: "Error", description: "You must be logged in to save posts.", variant: "destructive" });
      console.warn('Save action blocked: invalid userId', userId);
      return;
    }
    console.log('Saving/unsaving post', postId, 'as user', userId);
    if (!saved) {
      setSaved(true);
      try {
        const res = await axios.post(`${getBackendUrl()}/api/posts/${postId}/save`, { user_id: userId });
        if (res.status !== 200) throw new Error('Failed to save');
        toast({ title: "Post saved", description: "This post was added to your Saved Posts." });
      } catch (e) {
        setSaved(false);
        toast({ title: "Error", description: "Failed to save post.", variant: "destructive" });
        console.error('Save/unsave failed:', e);
      }
    } else {
      setSaved(false);
      try {
        const res = await axios.delete(`${getBackendUrl()}/api/posts/${postId}/save`, { data: { user_id: userId } });
        if (res.status !== 200) throw new Error('Failed to unsave');
        toast({ title: "Post unsaved", description: "This post was removed from your Saved Posts." });
      } catch (e) {
        setSaved(true);
        toast({ title: "Error", description: "Failed to unsave post.", variant: "destructive" });
        console.error('Save/unsave failed:', e);
      }
    }
    // Notify other components of save state change
    const event = new CustomEvent('postSaveChange', {
      detail: { postId, userId, saved: !saved }
    });
    window.dispatchEvent(event);
    if (onSaveChange) onSaveChange();
  };

  const handleShare = async () => {
    await axios.post(`${getBackendUrl()}/api/posts/${postId}/share`, { userId });
    await fetchActionCounts();
  };

  // Comment handler: opens comment modal
  const handleComment = async () => {
    setCommentModalOpen(true);
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  return (
    <div className="flex items-center w-full py-2 bg-card z-10 min-h-[48px]">
      <div className="flex space-x-2 flex-shrink-0 ml-4">
        <Button
          variant="ghost"
          size="sm"
          disabled={loading}
          onClick={async () => { if (!loading) { try { await handleLike(); } catch (e) { console.error(e); } } }}
          className={`px-4 py-2 transform -skew-x-12 ${liked && !loading ? "bg-[#0e9591]/20 text-[#0e9591]" : "bg-[#0e9591]/10 text-[#0e9591] hover:bg-[#0e9591]/20"}`}
        >
          <div className="transform skew-x-12 flex items-center">
            <Heart
              className={`h-4 w-4 mr-2 transition-colors duration-150 ${liked && !loading ? "fill-[#0e9591] stroke-[#0e9591]" : "stroke-[#0e9591]"}`}
              fill={loading ? "none" : liked ? "#0e9591" : "none"}
              stroke={loading ? "#0e9591" : liked ? "#0e9591" : "#0e9591"}
            />
            {likes}
          </div>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="px-4 py-2 transform -skew-x-12 bg-[#0e9591]/10 text-[#0e9591] hover:bg-[#0e9591]/20"
          onClick={() => setCommentModalOpen(true)}
        >
          <div className="transform skew-x-12 flex items-center">
            <MessageCircle className="h-4 w-4 mr-2" />
            {comments}
          </div>
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="px-4 py-2 transform -skew-x-12 bg-[#0e9591]/10 text-[#0e9591] hover:bg-[#0e9591]/20" 
          onClick={async () => { try { await handleShare(); } catch (e) { console.error(e); } }}
        >
          <div className="transform skew-x-12 flex items-center">
            <Share className="h-4 w-4 mr-2" />
            {shares}
          </div>
        </Button>
      </div>
      <div className="flex-1" />
      <Button
        variant="ghost"
        size="sm"
        disabled={loading}
        className={saved && !loading ? "text-[#0e9591] bg-[#0e9591]/20" : "text-muted-foreground"}
        onClick={handleSave}
      >
        <Bookmark
          className={`h-5 w-5 transition-colors duration-150 ${saved && !loading ? "fill-[#0e9591] stroke-[#0e9591]" : "stroke-[#0e9591]"}`}
          fill={loading ? "none" : saved ? "#0e9591" : "none"}
          stroke={loading ? "#0e9591" : saved ? "#0e9591" : "#0e9591"}
        />
      </Button>
      {/* Only show avatars on desktop */}
      {!isMobile && (
        <div className="flex space-x-2 ml-4">
          {likeUsers.slice(0, 3).map(user => (
            <img
              key={String(user.id)}
              src={user.avatar || "/placeholder.svg"}
              alt={user.email}
              className="w-6 h-6 rounded-full border cursor-pointer"
              title={user.email}
              onClick={() => onProfileClick && onProfileClick(user)}
            />
          ))}
        </div>
      )}
      <CommentModal
        open={commentModalOpen}
        onOpenChange={setCommentModalOpen}
        postId={String(postId)}
        userId={String(userId)}
        onCommentAdded={() => setComments(c => c + 1)}
        onCommentDeleted={() => setComments(c => c - 1)}
        onProfileClick={onProfileClick}
      />
    </div>
  );
}; 