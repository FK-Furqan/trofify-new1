import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Search, Plus, MessageCircle } from "lucide-react";
import { Conversation } from "@/lib/messagingService";
import { messagingService } from "@/lib/messagingService";
import { UniversalLoader } from "@/components/ui/universal-loader";
import { Badge } from "@/components/ui/badge";
import { getSocket } from "@/lib/socket";
import { MessageTicks } from "./MessageTicks";

interface ConversationsListProps {
  currentUserId?: string;
  onConversationSelect: (conversation: Conversation) => void;
  onNewMessage: () => void;
  onRefresh?: () => void; // Callback to trigger refresh
}

export const ConversationsList = ({ 
  currentUserId, 
  onConversationSelect, 
  onNewMessage,
  onRefresh
}: ConversationsListProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userStatuses, setUserStatuses] = useState<Record<string, 'online' | 'offline'>>({});

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!currentUserId) return;
    
    setLoading(true);
    try {
      const data = await messagingService.getUserConversations(currentUserId);
      setConversations(data || []);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // Set up real-time updates
  useEffect(() => {
    if (!currentUserId) return;

    const socket = getSocket();
    
    // Listen for new messages to update conversation list
    const handleNewMessage = (data: any) => {
      // Update conversations list when a new message is received
      setConversations(prev => {
        const updatedConversations = [...prev];
        const conversationIndex = updatedConversations.findIndex(c => c.id === data.conversation_id);
        
        if (conversationIndex !== -1) {
          // Update the conversation with new message info
          updatedConversations[conversationIndex] = {
            ...updatedConversations[conversationIndex],
            last_message: data.message.content,
            last_message_at: data.message.created_at,
            last_message_delivery_status: data.message.delivery_status,
            last_message_sender_id: data.message.sender_id,
            unread_count: data.message.sender_id !== currentUserId 
              ? (updatedConversations[conversationIndex].unread_count || 0) + 1
              : updatedConversations[conversationIndex].unread_count
          };
          
          // Move this conversation to the top
          const conversation = updatedConversations.splice(conversationIndex, 1)[0];
          updatedConversations.unshift(conversation);
        }
        
        return updatedConversations;
      });
    };

    // Listen for delivery status updates
    const handleMessageDelivered = (data: any) => {
      setConversations(prev => {
        const updatedConversations = [...prev];
        const conversationIndex = updatedConversations.findIndex(c => c.id === data.conversation_id);
        
        if (conversationIndex !== -1) {
          updatedConversations[conversationIndex] = {
            ...updatedConversations[conversationIndex],
            last_message_delivery_status: 'delivered'
          };
        }
        
        return updatedConversations;
      });
    };

    const handleMessageRead = (data: any) => {
      setConversations(prev => {
        const updatedConversations = [...prev];
        const conversationIndex = updatedConversations.findIndex(c => c.id === data.conversation_id);
        
        if (conversationIndex !== -1) {
          updatedConversations[conversationIndex] = {
            ...updatedConversations[conversationIndex],
            last_message_delivery_status: 'read'
          };
        }
        
        return updatedConversations;
      });
    };

    // Listen for user status updates
    const handleUserStatus = (data: any) => {
      setUserStatuses(prev => ({
        ...prev,
        [data.userId]: data.status
      }));
    };

    // Get initial status for all users in conversations
    const getInitialStatuses = async () => {
      const socket = getSocket();
      conversations.forEach(conv => {
        socket.emit('get_user_status', { userId: conv.other_user.id });
      });
    };

    // Listen for new messages
    socket.on('new_message', handleNewMessage);
    socket.on('message_delivered', handleMessageDelivered);
    socket.on('message_read', handleMessageRead);
    
    // Listen for user status updates
    socket.on('user_status', handleUserStatus);
    
    // Get initial statuses
    getInitialStatuses();

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_delivered', handleMessageDelivered);
      socket.off('message_read', handleMessageRead);
      socket.off('user_status', handleUserStatus);
    };
  }, [currentUserId, conversations]);

  // Main effect to load conversations
  useEffect(() => {
    if (currentUserId) {
      loadConversations();
    }
  }, [currentUserId, loadConversations]);

  // Auto-refresh conversations every 30 seconds if there are unread messages
  useEffect(() => {
    if (!currentUserId) return;
    
    const hasUnreadMessages = conversations.some(conv => conv.unread_count && conv.unread_count > 0);
    
    if (hasUnreadMessages) {
      const interval = setInterval(() => {
        loadConversations();
      }, 30000); // Refresh every 30 seconds if there are unread messages
      
      return () => clearInterval(interval);
    }
  }, [currentUserId, conversations.length, loadConversations]); // Only depend on currentUserId and conversations length, not the full conversations array

  // Handle external refresh requests
  useEffect(() => {
    if (onRefresh && currentUserId) {
      loadConversations();
    }
  }, [onRefresh, currentUserId, loadConversations]);

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv =>
    conv.other_user.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.other_user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format time for display
  const formatTime = (dateString: string) => {
    if (!dateString) return "";
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "0m";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  // Get conversation preview text
  const getConversationPreview = (conversation: Conversation) => {
    if (conversation.last_message) {
      return conversation.last_message;
    }
    return "See message";
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card flex-shrink-0">
        <h2 className="text-xl font-bold text-foreground">Messages</h2>
        <Button onClick={onNewMessage} className="bg-[#0e9591] hover:bg-[#0e9591]/90">
          <Plus className="h-4 w-4 mr-2" />
          New Message
        </Button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide">
        {loading ? (
          <UniversalLoader count={3} type="conversation" />
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No conversations yet</h3>
            <p className="text-muted-foreground mb-4">Start messaging someone to begin a conversation</p>
            <Button onClick={onNewMessage} className="bg-[#0e9591] hover:bg-[#0e9591]/90">
              <Plus className="h-4 w-4 mr-2" />
              Start a Conversation
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => onConversationSelect(conversation)}
                className={`flex items-center space-x-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                  conversation.unread_count && conversation.unread_count > 0 
                    ? 'bg-blue-50 dark:bg-blue-950/20 border-l-4 border-[#0e9591]' 
                    : ''
                }`}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conversation.other_user.avatar} />
                    <AvatarFallback>
                      {typeof conversation.other_user.display_name === 'string' && conversation.other_user.display_name.length > 0
                        ? conversation.other_user.display_name[0].toUpperCase()
                        : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {/* Online/Offline status indicator */}
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                    userStatuses[conversation.other_user.id] === 'online' ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                  {conversation.unread_count && conversation.unread_count > 0 && (
                    <Badge 
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-[#0e9591] text-white font-bold"
                    >
                      {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                    </Badge>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h3 className={`font-medium truncate ${
                        conversation.unread_count && conversation.unread_count > 0 
                          ? 'text-foreground font-semibold' 
                          : 'text-foreground'
                      }`}>
                        {conversation.other_user.display_name}
                      </h3>
                      <span className={`text-xs ${
                        userStatuses[conversation.other_user.id] === 'online' ? 'text-green-500' : 'text-gray-500'
                      }`}>
                        {userStatuses[conversation.other_user.id] === 'online' ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                      {formatTime(conversation.last_message_at)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <p className={`text-sm truncate flex-1 ${
                      conversation.unread_count && conversation.unread_count > 0 
                        ? 'text-foreground font-semibold' 
                        : 'text-muted-foreground'
                    }`}>
                      {getConversationPreview(conversation)}
                    </p>
                    <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                      {/* Show delivery status ticks for the last message if it's from the current user */}
                      {conversation.last_message_sender_id === currentUserId && conversation.last_message_delivery_status && (
                        <MessageTicks 
                          deliveryStatus={conversation.last_message_delivery_status} 
                          isOwnMessage={true} 
                        />
                      )}
                      <Badge variant="secondary" className="text-xs bg-[#0e9591] text-white">
                        {conversation.other_user.user_type}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Unread indicator dot - only show if there are unread messages */}
                  {conversation.unread_count && conversation.unread_count > 0 && (
                    <div className="mt-1">
                      <div className="w-2 h-2 bg-[#0e9591] rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 