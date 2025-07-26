import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Send, MoreVertical } from "lucide-react";
import { Message, Conversation } from "@/lib/messagingService";
import { messagingService } from "@/lib/messagingService";
import { UniversalLoader } from "@/components/ui/universal-loader";
import { Badge } from "@/components/ui/badge";

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
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load messages for the conversation
  const loadMessages = async () => {
    if (!conversation?.id) return;
    
    setLoading(true);
    try {
      const messagesData = await messagingService.getConversationMessages(conversation.id);
      setMessages(messagesData);
      
      // Mark messages as read
      if (currentUserId) {
        await messagingService.markMessagesAsRead(conversation.id, currentUserId);
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
    
    try {
      const newMessageData = await messagingService.sendMessage(
        conversation.id,
        currentUserId,
        conversation.other_user.id,
        messageContent
      );
      
      // Optimistically add the message to the list
      setMessages(prev => [...prev, newMessageData]);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Revert the optimistic update
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

  useEffect(() => {
    loadMessages();
  }, [conversation?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-card">
      {/* Fixed Header - Profile Section */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card flex-shrink-0 z-10">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarImage src={conversation?.other_user?.avatar || ''} />
            <AvatarFallback>
              {conversation?.other_user?.display_name?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-foreground">
              {conversation?.other_user?.display_name || 'User'}
            </h3>
            <Badge variant="secondary" className="text-xs">
              {conversation?.other_user?.user_type || 'user'}
            </Badge>
          </div>
        </div>
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>

      {/* Scrollable Messages Area - Only this section scrolls */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-background">
        <div className="p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center">
              <UniversalLoader count={3} />
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
                  <p className="text-xs opacity-70 mt-1">
                    {formatTime(message.created_at)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed Footer - Message Input Section */}
      <div className="p-4 border-t border-border bg-card flex-shrink-0 z-10">
        <div className="flex space-x-2">
          <Input
            placeholder="Type a message..."
            className="flex-1"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
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