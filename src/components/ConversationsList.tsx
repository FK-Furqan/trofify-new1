import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Search, Plus, MessageCircle } from "lucide-react";
import { Conversation } from "@/lib/messagingService";
import { messagingService } from "@/lib/messagingService";
import { UniversalLoader } from "@/components/ui/universal-loader";
import { Badge } from "@/components/ui/badge";

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

  // Load conversations
  const loadConversations = async () => {
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
  };

  useEffect(() => {
    loadConversations();
  }, [currentUserId]);

  // Refresh conversations when callback is triggered
  useEffect(() => {
    if (onRefresh) {
      loadConversations();
    }
  }, [onRefresh]);

  // Force refresh on component mount to clear any cached data
  useEffect(() => {
    const timer = setTimeout(() => {
      loadConversations();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Auto-refresh conversations every 10 seconds if there are unread messages
  useEffect(() => {
    const hasUnreadMessages = conversations.some(conv => conv.unread_count && conv.unread_count > 0);
    
    if (hasUnreadMessages) {
      const interval = setInterval(() => {
        loadConversations();
      }, 10000); // Refresh every 10 seconds if there are unread messages
      
      return () => clearInterval(interval);
    }
  }, [conversations]);

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
      <div className="flex-1 overflow-y-auto min-h-0">
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
                    <h3 className={`font-medium truncate ${
                      conversation.unread_count && conversation.unread_count > 0 
                        ? 'text-foreground font-semibold' 
                        : 'text-foreground'
                    }`}>
                      {conversation.other_user.display_name}
                    </h3>
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
                    <Badge variant="secondary" className="text-xs ml-2 flex-shrink-0">
                      {conversation.other_user.user_type}
                    </Badge>
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