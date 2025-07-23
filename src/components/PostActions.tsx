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
  onProfileClick,
  isOwner,
  onDelete,
  onSaveChange,
}: PostActionsProps) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(initialSaved);
  const [likes, setLikes] = useState(initialLikes);
  const [comments, setComments] = useState(initialComments);
  const [shares, setShares] = useState(initialShares);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [likeUsers, setLikeUsers] = useState<any[]>([]);
  const [shareUsers, setShareUsers] = useState<any[]>([]);
  const [saveUsers, setSaveUsers] = useState<any[]>([]);
  const [commentUsers, setCommentUsers] = useState<any[]>([]);

  const fetchActionCounts = async () => {
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
      const userLiked = (res.data.likes || []).some((user: any) => user.id.toString() === userId.toString());
      setLiked(userLiked);
      // Check if current user has saved this post
      const userSaved = (res.data.saves || []).some((user: any) => user.id.toString() === userId.toString());
      setSaved(userSaved);
      // Only keep error logs
    } catch (err) { console.error('Failed to fetch action counts:', err); }
  };

  useEffect(() => {
    fetchActionCounts();
    // eslint-disable-next-line
  }, [postId, userId]);

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

  const handleLike = async () => {
    if (!liked) {
      const res = await axios.post(`${getBackendUrl()}/api/posts/${postId}/like`, { userId });
      if (res.status === 200) {
        await fetchActionCounts();
      }
    } else {
      const res = await axios.delete(`${getBackendUrl()}/api/posts/${postId}/like`, { data: { userId } });
      if (res.status === 200) {
        await fetchActionCounts();
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

  const handleSave = async () => {
    if (!saved) {
      await axios.post(`${getBackendUrl()}/api/posts/${postId}/save`, { userId });
      toast({ title: "Post saved", description: "This post was added to your Saved Posts." });
    } else {
      await axios.delete(`${getBackendUrl()}/api/posts/${postId}/save`, { data: { userId } });
      toast({ title: "Post unsaved", description: "This post was removed from your Saved Posts." });
    }
    const newSavedState = !saved;
    setSaved(newSavedState);
    // Dispatch custom event to notify other components
    const event = new CustomEvent('postSaveChange', {
      detail: { postId, userId, saved: newSavedState }
    });
    window.dispatchEvent(event);
    if (onSaveChange) onSaveChange();
  };

  const handleShare = async () => {
    await axios.post(`${getBackendUrl()}/api/posts/${postId}/share`, { userId });
    await fetchActionCounts();
  };

  const handleComment = async () => {
    await axios.post(`${getBackendUrl()}/api/posts/${postId}/comment`, { userId, comment: "" }); // Assuming empty string for now
    await fetchActionCounts();
    setCommentModalOpen(false); // Close modal after adding comment
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  return (
    <div className="flex items-center w-full py-2 bg-card z-10 min-h-[48px]">
      <div className="flex space-x-2 flex-shrink-0 ml-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => { try { await handleLike(); } catch (e) { console.error(e); } }}
          className={`px-4 py-2 transform -skew-x-12 ${liked ? "bg-red-500/20 text-red-500" : "bg-[#0e9591]/10 text-[#0e9591] hover:bg-[#0e9591]/20"}`}
        >
          <div className="transform skew-x-12 flex items-center">
            <Heart className={`h-4 w-4 mr-2 ${liked ? "fill-current" : ""}`} />
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
      <Button variant="ghost" size="sm" className={saved ? "text-[#0e9591]" : "text-muted-foreground"} onClick={handleSave}>
        <Bookmark className={`h-5 w-5 ${saved ? "fill-current" : ""}`} />
      </Button>
      {/* Only show avatars on desktop */}
      {!isMobile && (
        <div className="flex space-x-2 ml-4">
          {likeUsers.slice(0, 3).map(user => (
            <img
              key={user.id.toString()}
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
        postId={postId}
        userId={userId}
        onCommentAdded={() => setComments(c => c + 1)}
        onCommentDeleted={() => setComments(c => c - 1)}
        onProfileClick={onProfileClick}
      />
    </div>
  );
}; 