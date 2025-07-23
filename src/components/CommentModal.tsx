import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { getBackendUrl } from "@/lib/utils";

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
  const fetchComments = async () => {
    setLoading(true);
    const res = await axios.get(`${getBackendUrl()}/api/posts/${postId}/actions`);
    setComments(res.data.comments || []);
    // Fetch missing profiles for commenters
    const uniqueEmails = Array.from(new Set((res.data.comments || []).map(c => c.email)));
    const newProfiles = { ...profiles };
    await Promise.all(uniqueEmails.map(async (email: string) => {
      if (!newProfiles[email]) {
        try {
          const profileRes = await fetch(`${getBackendUrl()}/signup/profile`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
          if (profileRes.ok) {
            const profile = await profileRes.json();
            newProfiles[email] = profile;
          }
        } catch {}
      }
    }));
    setProfiles(newProfiles);
    console.log("CommentModal - Fetched profiles:", newProfiles);
    setLoading(false);
  };
  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    await axios.post(`${getBackendUrl()}/api/posts/${postId}/comment`, { userId, comment: commentText });
    setCommentText("");
    fetchComments();
    if (onCommentAdded) onCommentAdded();
  };
  const handleDeleteComment = async (commentId) => {
    await axios.delete(`${getBackendUrl()}/api/posts/${postId}/comment/${commentId}`, { data: { userId } });
    fetchComments();
    if (onCommentDeleted) onCommentDeleted();
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
  const getDisplayName = (email: string) => {
    const profile = profiles[email];
    if (!profile) return email.split('@')[0]; // Fallback to email username
    
    // Return appropriate name based on user type
    switch (profile.user_type) {
      case 'athlete':
        return profile.name || profile.full_name || email.split('@')[0];
      case 'coach':
        return profile.name || profile.full_name || email.split('@')[0];
      case 'fan':
        return profile.name || profile.full_name || email.split('@')[0];
      case 'venue':
        return profile.name || profile.venue_name || email.split('@')[0];
      case 'sports_brand':
        return profile.name || profile.brand_name || email.split('@')[0];
      default:
        return profile.name || email.split('@')[0];
    }
  };

  // Helper function to check if profile is still loading
  const isProfileLoading = (email: string) => {
    return !profiles[email] && loading;
  };

  const handleAvatarClick = (comment: any) => {
    if (onProfileClick) {
      const profile = profiles[comment.email as string] || { 
        id: comment.user_id,
        email: comment.email,
        name: (comment.email as string).split('@')[0],
        user_type: 'user'
      };
      onOpenChange(false);
      setTimeout(() => onProfileClick(profile), 200);
    }
  };
  const renderComments = () => (
    <div className="flex-1 overflow-y-auto px-4 py-2">
      {loading ? (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
          <svg className="animate-spin" width="40" height="40" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="#0e9591" strokeWidth="5" strokeDasharray="31.4 31.4"/></svg>
          <div className="mt-2 font-semibold">Loading comments...</div>
        </div>
      ) : comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
          <svg width="64" height="64" fill="none"><rect width="64" height="64" rx="16" fill="currentColor" opacity="0.1"/><text x="32" y="38" textAnchor="middle" fontSize="14" fill="currentColor" opacity="0.5">💬</text></svg>
          <div className="mt-2 font-semibold">No comments yet</div>
          <div className="text-sm">Be the first to comment.</div>
        </div>
      ) : (
        comments.map(comment => (
          <div
            key={comment.id}
            className="flex items-start gap-3 py-2 border-b border-border"
            onTouchStart={e => handleCommentPress(comment, e)}
            onTouchEnd={handleCommentRelease}
            onMouseDown={e => !isMobile && comment.user_id === userId && e.button === 2 && handleDeleteComment(comment.id)}
          >
            <img src={(profiles[comment.email as string]?.avatar) || "/placeholder.svg"} alt={comment.email as string} className="w-8 h-8 rounded-full cursor-pointer" onClick={() => handleAvatarClick(comment)} />
            <div className="flex-1">
              <div 
                className="font-semibold text-sm cursor-pointer hover:underline text-[#0e9591]"
                onClick={() => {
                  if (onProfileClick) {
                    const profile = profiles[comment.email as string] || { 
                      id: comment.user_id,
                      email: comment.email,
                      name: (comment.email as string).split('@')[0],
                      user_type: 'user'
                    };
                    onOpenChange(false);
                    setTimeout(() => onProfileClick(profile), 200);
                  }
                }}
              >
                {getDisplayName(comment.email as string)}
              </div>
              <div className="text-foreground text-sm">{comment.comment}</div>
              <div className="text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleString()}</div>
            </div>
            {comment.user_id === userId && !isMobile && (
              <Button size="icon" variant="ghost" onClick={() => handleDeleteComment(comment.id)} title="Delete comment">
                🗑️
              </Button>
            )}
          </div>
        ))
      )}
    </div>
  );
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
        <SheetContent side="bottom" className="h-[90vh] flex flex-col">
          <div className="flex-1 flex flex-col">{renderComments()}</div>
          {renderInput()}
        </SheetContent>
      </Sheet>
    );
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full flex flex-col">
        <div className="flex-1 flex flex-col">{renderComments()}</div>
        {renderInput()}
      </DialogContent>
    </Dialog>
  );
} 