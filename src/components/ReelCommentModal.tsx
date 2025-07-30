import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Heart, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { getBackendUrl } from '@/lib/utils';

interface Comment {
  id: string;
  comment: string;
  created_at: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    user_type: string;
  };
  like_count: number;
  reply_count: number;
  is_liked?: boolean;
  replies?: Comment[];
}

interface ReelCommentModalProps {
  reelId: string;
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
  onProfileClick?: (userId: string) => void;
}

export const ReelCommentModal: React.FC<ReelCommentModalProps> = ({
  reelId,
  isOpen,
  onClose,
  currentUserId,
  onProfileClick
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [showReplyInputs, setShowReplyInputs] = useState<Set<string>>(new Set());
  
  const commentInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchComments();
      // Focus on comment input when modal opens
      setTimeout(() => {
        commentInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, reelId]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${getBackendUrl()}/api/reels/${reelId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: "Error",
        description: "Failed to load comments.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!currentUserId) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to comment.",
        variant: "destructive"
      });
      return;
    }

    if (!newComment.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${getBackendUrl()}/api/reels/${reelId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUserId,
          comment: newComment.trim(),
        }),
      });

      if (response.ok) {
        const newCommentData = await response.json();
        setComments(prev => [newCommentData, ...prev]);
        setNewComment('');
        toast({
          title: "Comment posted!",
          description: "Your comment has been added.",
        });
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: "Error",
        description: "Failed to post comment.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!currentUserId) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to like comments.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`${getBackendUrl()}/api/reels/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: currentUserId }),
      });

      if (response.ok) {
        const { liked } = await response.json();
        setComments(prev => prev.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              like_count: liked ? comment.like_count + 1 : comment.like_count - 1,
              is_liked: liked
            };
          }
          return comment;
        }));
      }
    } catch (error) {
      console.error('Error toggling comment like:', error);
    }
  };

  const handleReply = async (commentId: string) => {
    const replyText = replyTexts[commentId];
    if (!replyText?.trim() || !currentUserId) return;

    try {
      const response = await fetch(`${getBackendUrl()}/api/reels/${reelId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUserId,
          comment: replyText.trim(),
          parentCommentId: commentId,
        }),
      });

      if (response.ok) {
        const newReply = await response.json();
        setComments(prev => prev.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              reply_count: comment.reply_count + 1,
              replies: [...(comment.replies || []), newReply]
            };
          }
          return comment;
        }));
        
        // Clear reply text and hide input
        setReplyTexts(prev => ({ ...prev, [commentId]: '' }));
        setShowReplyInputs(prev => {
          const newSet = new Set(prev);
          newSet.delete(commentId);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error posting reply:', error);
      toast({
        title: "Error",
        description: "Failed to post reply.",
        variant: "destructive"
      });
    }
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const toggleReplyInput = (commentId: string) => {
    setShowReplyInputs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-gray-900 rounded-t-lg w-full max-w-md max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h3 className="text-lg font-semibold">Comments</h3>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Comments List */}
            <ScrollArea className="flex-1 p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No comments yet</p>
                  <p className="text-sm">Be the first to comment!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="space-y-3">
                      {/* Main Comment */}
                      <div className="flex space-x-3">
                        <Avatar
                          className="h-8 w-8 cursor-pointer"
                          onClick={() => onProfileClick?.(comment.user.id)}
                        >
                          <AvatarImage src={comment.user.avatar} />
                          <AvatarFallback>{comment.user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <span
                                className="font-semibold text-sm cursor-pointer hover:underline"
                                onClick={() => onProfileClick?.(comment.user.id)}
                              >
                                {comment.user.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatTime(comment.created_at)}
                              </span>
                            </div>
                            <p className="text-sm">{comment.comment}</p>
                          </div>
                          
                          {/* Comment Actions */}
                          <div className="flex items-center space-x-4 mt-2 text-sm">
                            <button
                              onClick={() => handleLikeComment(comment.id)}
                              className={`flex items-center space-x-1 hover:text-red-500 ${
                                comment.is_liked ? 'text-red-500' : 'text-gray-500'
                              }`}
                            >
                              <Heart className={`h-4 w-4 ${comment.is_liked ? 'fill-current' : ''}`} />
                              <span>{formatCount(comment.like_count)}</span>
                            </button>
                            <button
                              onClick={() => toggleReplyInput(comment.id)}
                              className="flex items-center space-x-1 text-gray-500 hover:text-blue-500"
                            >
                              <MessageCircle className="h-4 w-4" />
                              <span>Reply</span>
                            </button>
                          </div>

                          {/* Reply Input */}
                          {showReplyInputs.has(comment.id) && (
                            <div className="mt-3 flex space-x-2">
                              <Input
                                placeholder="Write a reply..."
                                value={replyTexts[comment.id] || ''}
                                onChange={(e) => setReplyTexts(prev => ({
                                  ...prev,
                                  [comment.id]: e.target.value
                                }))}
                                className="flex-1 text-sm"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleReply(comment.id);
                                  }
                                }}
                              />
                              <Button
                                size="sm"
                                onClick={() => handleReply(comment.id)}
                                disabled={!replyTexts[comment.id]?.trim()}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </div>
                          )}

                          {/* Show Replies Button */}
                          {comment.reply_count > 0 && (
                            <button
                              onClick={() => toggleReplies(comment.id)}
                              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-500 mt-2"
                            >
                              {expandedReplies.has(comment.id) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                              <span>View {comment.reply_count} replies</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Replies */}
                      {expandedReplies.has(comment.id) && comment.replies && (
                        <div className="ml-11 space-y-3">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex space-x-3">
                              <Avatar
                                className="h-6 w-6 cursor-pointer"
                                onClick={() => onProfileClick?.(reply.user.id)}
                              >
                                <AvatarImage src={reply.user.avatar} />
                                <AvatarFallback>{reply.user.name[0]}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span
                                      className="font-semibold text-xs cursor-pointer hover:underline"
                                      onClick={() => onProfileClick?.(reply.user.id)}
                                    >
                                      {reply.user.name}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {formatTime(reply.created_at)}
                                    </span>
                                  </div>
                                  <p className="text-xs">{reply.comment}</p>
                                </div>
                                
                                {/* Reply Actions */}
                                <div className="flex items-center space-x-4 mt-1 text-xs">
                                  <button
                                    onClick={() => handleLikeComment(reply.id)}
                                    className={`flex items-center space-x-1 hover:text-red-500 ${
                                      reply.is_liked ? 'text-red-500' : 'text-gray-500'
                                    }`}
                                  >
                                    <Heart className={`h-3 w-3 ${reply.is_liked ? 'fill-current' : ''}`} />
                                    <span>{formatCount(reply.like_count)}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Comment Input */}
            <div className="p-4 border-t dark:border-gray-700">
              <div className="flex space-x-2">
                <Input
                  ref={commentInputRef}
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitComment();
                    }
                  }}
                  disabled={isSubmitting}
                />
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isSubmitting}
                  size="sm"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 