import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { getBackendUrl } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UniversalLoader } from "@/components/ui/universal-loader";

interface CommentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  userId: string;
  onCommentAdded?: () => void;
  onCommentDeleted?: () => void;
  onProfileClick?: (profile: any) => void;
}

export function CommentModal({ open, onOpenChange, postId, userId, onCommentAdded, onCommentDeleted, onProfileClick }: CommentModalProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<Record<string, any>>({}); // email/user_id -> profile
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const commentsContainerRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  useEffect(() => {
    if (open) fetchComments();
    // eslint-disable-next-line
  }, [open]);
  useEffect(() => {
    // After comments render, check if container height exceeds 50vh
    if (commentsContainerRef.current) {
      const maxHeight = window.innerHeight * 0.5;
      setIsScrollable(commentsContainerRef.current.scrollHeight > maxHeight);
    }
  }, [comments, expandedComments]);
  // --- CommentModal: Handles displaying, adding, and deleting comments for a post. ---
  // Fetches all comments for the post and updates local state. Uses joined users object for avatar/name/profile.
  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${getBackendUrl()}/api/posts/${postId}/comments`);
      setComments(res.data || []);
      setLoading(false);
    } catch (e) {
      setLoading(false);
      console.error('Failed to fetch comments:', e);
    }
  };
  // Adds a new comment and refreshes the comment list
  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    try {
      // Use user_id (snake_case) to match backend
      await axios.post(`${getBackendUrl()}/api/posts/${postId}/comments`, { user_id: userId, comment: commentText });
      setCommentText("");
      await fetchComments();
      if (onCommentAdded) onCommentAdded();
    } catch (e) { console.error('Failed to add comment:', e); }
  };
  // Deletes a comment and refreshes the comment list
  const handleDeleteComment = async (commentId) => {
    try {
      // Use user_id (snake_case) to match backend
      await axios.delete(`${getBackendUrl()}/api/posts/${postId}/comment/${commentId}`, { data: { user_id: userId } });
      await fetchComments();
      if (onCommentDeleted) onCommentDeleted();
    } catch (e) { console.error('Failed to delete comment:', e); }
  };
  // Long press for mobile, menu for desktop
  const handleCommentPress = (comment, e) => {
    if (isMobile && comment.id && comment.user_id === userId) {
      longPressTimer.current = setTimeout(() => handleDeleteComment(comment.id), 700);
    }
  };
  const handleCommentRelease = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };
  // Helper function to get display name based on user type
  const getDisplayName = (comment) => {
    // Use display_name from joined users object, fallback to email or 'User'
    if (comment.users && comment.users.display_name) return comment.users.display_name;
    if (comment.users && comment.users.email) return comment.users.email.split('@')[0];
    return 'User';
  };

  // Helper function to check if profile is still loading
  const isProfileLoading = (email: string) => {
    return !profiles[email] && loading;
  };

  // Helper to get the correct avatar URL (copied from ProfileView)
  const getAvatarUrl = (avatar?: string) => {
    if (!avatar) return "/placeholder.svg";
    if (avatar.startsWith("http")) return avatar;
    if (avatar.startsWith("/")) return avatar;
    return `https://trofify-media.s3.amazonaws.com/${avatar}`;
  };

  // Handles navigation to user profile when avatar or name is clicked
  const handleAvatarClick = (comment) => {
    if (onProfileClick && comment.users) {
      // Pass a profile object with a valid avatar URL
      const profile = {
        ...comment.users,
        avatar: getAvatarUrl(comment.users.avatar)
      };
      onOpenChange(false);
      setTimeout(() => onProfileClick(profile), 200);
    }
  };
  const renderComments = () => {
    return (
      <div
        ref={commentsContainerRef}
        className={
          `px-4 py-2 transition-all duration-200 ` +
          (isScrollable
            ? 'max-h-[50vh] overflow-y-auto scroll-smooth scrollbar-hide'
            : 'max-h-none overflow-visible')
        }
        style={{ minHeight: 0 }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <UniversalLoader count={2} />
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <svg width="64" height="64" fill="none"><rect width="64" height="64" rx="16" fill="currentColor" opacity="0.1"/><text x="32" y="38" textAnchor="middle" fontSize="14" fill="currentColor" opacity="0.5">💬</text></svg>
            <div className="mt-2 font-semibold">No comments yet</div>
            <div className="text-sm">Be the first to comment.</div>
          </div>
        ) : (
          comments.map(comment => {
            const isExpanded = expandedComments[comment.id];
            return (
              <div
                key={comment.id}
                className="flex items-start space-x-3 mb-4"
                onTouchStart={e => handleCommentPress(comment, e)}
                onTouchEnd={handleCommentRelease}
                onMouseDown={e => !isMobile && comment.user_id === userId && e.button === 2 && handleDeleteComment(comment.id)}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={getAvatarUrl(comment.users?.avatar)} alt={getDisplayName(comment)} className="object-cover" />
                  <AvatarFallback>{getDisplayName(comment)[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div 
                    className="font-semibold text-sm cursor-pointer hover:underline text-[#0e9591]"
                    onClick={() => handleAvatarClick(comment)}
                  >
                    {getDisplayName(comment)}
                  </div>
                  <div className={isExpanded ? "text-foreground text-sm" : "text-foreground text-sm line-clamp-4"}>
                    {comment.comment}
                  </div>
                  {!isExpanded && comment.comment && comment.comment.split(/\r?\n| /).length > 20 && (
                    <button
                      className="text-xs text-[#0e9591] font-semibold mt-1 focus:outline-none"
                      onClick={() => setExpandedComments(prev => ({ ...prev, [comment.id]: true }))}
                    >
                      Read more
                    </button>
                  )}
                  {isExpanded && comment.comment && comment.comment.split(/\r?\n| /).length > 20 && (
                    <button
                      className="text-xs text-[#0e9591] font-semibold mt-1 focus:outline-none"
                      onClick={() => setExpandedComments(prev => ({ ...prev, [comment.id]: false }))}
                    >
                      Show less
                    </button>
                  )}
                  <div className="text-xs text-muted-foreground">{comment.created_at ? new Date(comment.created_at).toLocaleString() : ''}</div>
                </div>
                {comment.user_id === userId && !isMobile && (
                  <Button size="icon" variant="ghost" onClick={() => handleDeleteComment(comment.id)} title="Delete comment">
                    🗑️
                  </Button>
                )}
              </div>
            );
          })
        )}
      </div>
    );
  };
  const renderInput = () => (
    <div className="flex items-center border-t border-border p-2 bg-card">
      <input
        type="text"
        value={commentText}
        onChange={e => setCommentText(e.target.value)}
        placeholder="Write a comment..."
        className="flex-1 border border-input bg-background text-foreground rounded px-3 py-2 mr-2 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#0e9591] focus:border-transparent"
        onKeyDown={e => e.key === "Enter" && handleAddComment()}
      />
      <Button onClick={handleAddComment} disabled={!commentText.trim()} className="bg-[#0e9591] text-white hover:bg-[#087a74]">Post</Button>
    </div>
  );
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="flex flex-col rounded-t-2xl">
          {renderComments()}
          {renderInput()}
        </SheetContent>
      </Sheet>
    );
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full flex flex-col rounded-t-2xl">
        {renderComments()}
        {renderInput()}
      </DialogContent>
    </Dialog>
  );
} 