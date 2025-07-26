import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MoreVertical, Send, ChevronDown } from 'lucide-react';
import { messagingService, Message, Conversation } from '@/lib/messagingService';
import { getSocket } from '@/lib/socket';
import { MessageTicks } from './MessageTicks';

// Custom slow bounce animation
const slowBounceStyle = `
  @keyframes slowBounce {
    0%, 20%, 53%, 80%, 100% {
      transform: translate3d(0, 0, 0);
    }
    40%, 43% {
      transform: translate3d(0, -8px, 0);
    }
    70% {
      transform: translate3d(0, -4px, 0);
    }
    90% {
      transform: translate3d(0, -2px, 0);
    }
  }
`;

interface ConversationViewProps {
  conversation: Conversation;
  currentUserId?: string;
  onBack: () => void;
  onMessagesRead?: () => void; // Callback to trigger badge update
}

export const ConversationView = ({ 
  conversation, 
  currentUserId, 
  onBack,
  onMessagesRead
}: ConversationViewProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [otherUserStatus, setOtherUserStatus] = useState<'online' | 'offline'>('offline');
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  // Safety check for conversation object
  if (!conversation || !conversation.other_user) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Invalid conversation data</p>
          <Button onClick={onBack} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Format time for display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "0m";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  // Handle scroll events to show/hide scroll to bottom button
  const handleScroll = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      // Show button as soon as user scrolls up (more sensitive threshold)
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 10; // 10px threshold
      setShowScrollToBottom(!isAtBottom);
    }
  }, []);

  // Scroll to bottom function
  const handleScrollToBottom = () => {
    scrollToBottom();
  };

  // Load messages for the conversation
  const loadMessages = async () => {
    if (!conversation?.id) return;
    
    setLoading(true);
    try {
      const messagesData = await messagingService.getConversationMessages(conversation.id);
      setMessages(messagesData);
      
      // Mark messages as read and immediately update local state
      if (currentUserId) {
        // Mark all unread messages as read
        await messagingService.markMessagesAsRead(conversation.id, currentUserId);
        
        // Immediately update local message state to show read status
        setMessages(prev => prev.map(msg => {
          if (msg.receiver_id === currentUserId && !msg.is_read) {
            return { ...msg, is_read: true, delivery_status: 'read' };
          }
          return msg;
        }));
        
        // Trigger badge update
        onMessagesRead?.();
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Send a new message
  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation?.id || !currentUserId) return;
    
    const messageContent = newMessage.trim();
    setNewMessage("");
    setSending(true);
    
    // Emit typing status as false when sending
    const socket = getSocket();
    socket.emit('typing_status', {
      conversationId: conversation.id,
      userId: currentUserId,
      isTyping: false
    });
    
    try {
      await messagingService.sendMessage(
        conversation.id,
        currentUserId,
        conversation.other_user.id,
        messageContent
      );
      
      // Don't add message optimistically - let the socket event handle it
      // This prevents duplicates
      
      // Focus the input field after sending
      setTimeout(() => {
        focusInput();
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Revert the message content if sending failed
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Handle input change with typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);
    
    // Emit typing status
    if (conversation?.id && currentUserId) {
      const socket = getSocket();
      socket.emit('typing_status', {
        conversationId: conversation.id,
        userId: currentUserId,
        isTyping: value.length > 0
      });
    }
  };

  // Clear typing indicator after delay
  const clearTypingIndicator = () => {
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    
    const timeout = setTimeout(() => {
      setIsOtherUserTyping(false);
    }, 3000); // Clear after 3 seconds of no typing
    
    typingTimeout.current = timeout;
  };

  // Set up real-time message listeners
  useEffect(() => {
    if (!conversation?.id || !currentUserId) return;

    const socket = getSocket();
    
    // Listen for new messages in this conversation
    const handleNewMessage = (data: any) => {
      if (data.conversation_id === conversation.id) {
        const newMessage = data.message;
        
        // If this is a message received by the current user, mark it as read immediately
        if (newMessage.receiver_id === currentUserId) {
          // Update the message to show as read immediately
          const updatedMessage = { ...newMessage, is_read: true, delivery_status: 'read' };
          setMessages(prev => [...prev, updatedMessage]);
          
          // Mark as read in backend
          setTimeout(async () => {
            try {
              await messagingService.markMessagesAsRead(conversation.id, currentUserId);
              onMessagesRead?.();
            } catch (error) {
              console.error('Error marking new message as read:', error);
            }
          }, 500);
        } else {
          // For sent messages, just add them normally
          setMessages(prev => [...prev, newMessage]);
        }
        
        // Clear typing indicator when message is received
        setIsOtherUserTyping(false);
        if (typingTimeout.current) {
          clearTimeout(typingTimeout.current);
        }
      }
    };

    // Listen for user status updates
    const handleUserStatus = (data: any) => {
      if (data.userId === conversation.other_user.id) {
        setOtherUserStatus(data.status);
      }
    };

    // Listen for typing status updates
    const handleTypingStatus = (data: any) => {
      if (data.conversationId === conversation.id && data.userId !== currentUserId) {
        if (data.isTyping) {
          setIsOtherUserTyping(true);
          clearTypingIndicator(); // Reset the timeout
        } else {
          setIsOtherUserTyping(false);
          if (typingTimeout.current) {
            clearTimeout(typingTimeout.current);
          }
        }
      }
    };

    // Listen for delivery status updates
    const handleMessageDelivered = (data: any) => {
      if (data.conversation_id === conversation.id) {
        console.log('Message delivered event received:', data);
        setMessages(prev => prev.map(msg => {
          if (msg.id === data.message_id) {
            // Only update to delivered if not already read
            if (msg.delivery_status !== 'read') {
              console.log(`Updating message ${msg.id} from ${msg.delivery_status} to delivered`);
              return { ...msg, delivery_status: 'delivered' };
            } else {
              console.log(`Message ${msg.id} is already read, keeping read status`);
            }
            return msg;
          }
          return msg;
        }));
      }
    };

    const handleMessageRead = (data: any) => {
      if (data.conversation_id === conversation.id) {
        console.log('Message read event received:', data);
        setMessages(prev => prev.map(msg => {
          if (msg.id === data.message_id) {
            console.log(`Updating message ${msg.id} to read status`);
            return { ...msg, delivery_status: 'read', is_read: true };
          }
          return msg;
        }));
      }
    };

    // Join conversation room
    socket.emit('join_conversation', { conversationId: conversation.id, userId: currentUserId });

    // Listen for new messages
    socket.on('new_message', handleNewMessage);
    
    // Listen for user status updates
    socket.on('user_status', handleUserStatus);
    
    // Listen for typing status updates
    socket.on('typing_status', handleTypingStatus);

    // Listen for delivery status updates
    socket.on('message_delivered', handleMessageDelivered);
    socket.on('message_read', handleMessageRead);
    
    // Get initial user status
    socket.emit('get_user_status', { userId: conversation.other_user.id });

    return () => {
      // Cleanup socket listeners
      socket.off('new_message', handleNewMessage);
      socket.off('user_status', handleUserStatus);
      socket.off('typing_status', handleTypingStatus);
      socket.off('message_delivered', handleMessageDelivered);
      socket.off('message_read', handleMessageRead);
      socket.emit('leave_conversation', { conversationId: conversation.id, userId: currentUserId });
      
      // Clear typing timeout
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
    };
  }, [conversation?.id, currentUserId, conversation?.other_user?.id, onMessagesRead, typingTimeout.current]);

  useEffect(() => {
    loadMessages();
  }, [conversation?.id]);

  // Mark messages as read when conversation is viewed
  useEffect(() => {
    if (conversation?.id && currentUserId && messages.length > 0) {
      // Check if there are any unread messages
      const hasUnreadMessages = messages.some(msg => 
        msg.receiver_id === currentUserId && !msg.is_read
      );
      
      if (hasUnreadMessages) {
        // Mark messages as read and update local state immediately
        messagingService.markMessagesAsRead(conversation.id, currentUserId).then(() => {
          setMessages(prev => prev.map(msg => {
            if (msg.receiver_id === currentUserId && !msg.is_read) {
              return { ...msg, is_read: true, delivery_status: 'read' };
            }
            return msg;
          }));
          onMessagesRead?.();
        }).catch(error => {
          console.error('Error marking messages as read:', error);
        });
      }
    }
  }, [conversation?.id, currentUserId, messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    focusInput();
  }, []);

  // Cleanup typing status when component unmounts or conversation changes
  useEffect(() => {
    return () => {
      // Emit typing status as false when leaving
      if (conversation?.id && currentUserId) {
        const socket = getSocket();
        socket.emit('typing_status', {
          conversationId: conversation.id,
          userId: currentUserId,
          isTyping: false
        });
      }
      
      // Clear typing timeout
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
    };
  }, [conversation?.id, currentUserId, typingTimeout.current]);

  return (
    <div className="max-h-[calc(100vh-4rem)] h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)] flex flex-col bg-card min-h-0">
      {/* Inject custom animation CSS */}
      <style dangerouslySetInnerHTML={{ __html: slowBounceStyle }} />
      
      {/* Fixed Header - Profile Section */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card flex-shrink-0 z-10">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={conversation?.other_user?.avatar || ''} />
              <AvatarFallback>
                {conversation?.other_user?.display_name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            {/* Online/Offline status indicator */}
            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
              otherUserStatus === 'online' ? 'bg-green-500' : 'bg-gray-400'
            }`} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-foreground">
                {conversation?.other_user?.display_name || 'User'}
              </h3>
              <Badge variant="secondary" className="text-xs bg-[#0e9591] text-white">
                {conversation?.other_user?.user_type || 'user'}
              </Badge>
              <span className={`text-xs ${otherUserStatus === 'online' ? 'text-green-500' : 'text-gray-500'}`}>
                {otherUserStatus === 'online' ? 'Online' : 'Offline'}
              </span>
            </div>
            {/* Typing indicator below user name */}
            {isOtherUserTyping && (
              <div className="flex items-center space-x-1 mt-1">
                <span className="text-xs text-[#0e9591] font-medium">typing</span>
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-[#0e9591] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1 h-1 bg-[#0e9591] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1 h-1 bg-[#0e9591] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>

      {/* Scrollable Messages Area - Only this section scrolls */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-background scrollbar-hide relative" ref={messagesContainerRef} onScroll={handleScroll}>
        <div className="p-4 space-y-4">
          {loading ? (
            <div className="space-y-4">
              {/* Message skeleton - left side (received) */}
              <div className="flex justify-start">
                <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-muted animate-pulse">
                  <div className="h-4 bg-muted-foreground/20 rounded mb-2"></div>
                  <div className="h-3 bg-muted-foreground/20 rounded w-16"></div>
                </div>
              </div>
              
              {/* Message skeleton - right side (sent) */}
              <div className="flex justify-end">
                <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-[#0e9591]/20 animate-pulse">
                  <div className="h-4 bg-[#0e9591]/40 rounded mb-2"></div>
                  <div className="h-3 bg-[#0e9591]/40 rounded w-12"></div>
                </div>
              </div>
              
              {/* Message skeleton - left side (received) */}
              <div className="flex justify-start">
                <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-muted animate-pulse">
                  <div className="h-4 bg-muted-foreground/20 rounded mb-1"></div>
                  <div className="h-4 bg-muted-foreground/20 rounded mb-2 w-3/4"></div>
                  <div className="h-3 bg-muted-foreground/20 rounded w-20"></div>
                </div>
              </div>
              
              {/* Message skeleton - right side (sent) */}
              <div className="flex justify-end">
                <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-[#0e9591]/20 animate-pulse">
                  <div className="h-4 bg-[#0e9591]/40 rounded mb-2 w-2/3"></div>
                  <div className="h-3 bg-[#0e9591]/40 rounded w-14"></div>
                </div>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-muted-foreground mb-4">
                <p className="text-lg font-medium">No messages yet</p>
                <p className="text-sm">Start the conversation by sending a message!</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === currentUserId ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender_id === currentUserId
                      ? "bg-[#0e9591] text-white"
                      : message.is_read 
                        ? "bg-muted text-foreground"
                        : "bg-blue-100 dark:bg-blue-900/30 text-foreground border-2 border-blue-300 dark:border-blue-600"
                  }`}
                >
                  <p className={`text-sm ${!message.is_read && message.sender_id !== currentUserId ? "font-semibold" : ""}`}>
                    {message.content}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs opacity-70">
                      {formatTime(message.created_at)}
                    </p>
                    <MessageTicks 
                      deliveryStatus={message.delivery_status || 'sent'} 
                      isOwnMessage={message.sender_id === currentUserId} 
                    />
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed Footer - Message Input Section */}
      <div className="p-4 border-t border-border bg-card flex-shrink-0 z-10">
        {/* Scroll to bottom button - positioned above the separator line */}
        {showScrollToBottom && (
          <div className="flex justify-end mb-2">
            <Button
              onClick={handleScrollToBottom}
              size="sm"
              className="rounded-full w-8 h-8 bg-[#0e9591] hover:bg-[#0e9591]/90 text-white shadow-lg hover:animate-none transition-all duration-200 hover:scale-110"
              style={{
                animation: 'slowBounce 2s infinite'
              }}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <div className="flex space-x-2">
          <Input
            ref={inputRef}
            placeholder="Type a message..."
            className="flex-1"
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            disabled={sending}
          />
          <Button 
            onClick={sendMessage} 
            disabled={!newMessage.trim() || sending}
            className="bg-[#0e9591] hover:bg-[#0e9591]/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}; 