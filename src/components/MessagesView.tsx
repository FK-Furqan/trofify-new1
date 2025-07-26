import { useState, useEffect } from "react";
import { ConversationsList } from "./ConversationsList";
import { ConversationView } from "./ConversationView";
import { NewMessageView } from "./NewMessageView";
import { Conversation } from "@/lib/messagingService";
import { messagingService } from "@/lib/messagingService";

interface MessagesViewProps {
  onProfileClick?: (profile: any) => void;
  currentUserId?: string;
  targetUserId?: string; // For direct messaging from profile
  onClearTargetUser?: () => void; // Callback to clear targetUserId
  onRefreshConversations?: () => void; // Callback to refresh conversations list
}

type ViewState = 'conversations' | 'conversation' | 'new-message';

export const MessagesView = ({ onProfileClick, currentUserId, targetUserId, onClearTargetUser, onRefreshConversations }: MessagesViewProps) => {
  const [currentView, setCurrentView] = useState<ViewState>('conversations');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);

  // Handle conversation selection
  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setCurrentView('conversation');
  };

  // Handle new message button click
  const handleNewMessage = () => {
    setCurrentView('new-message');
  };

  // Handle back navigation
  const handleBack = () => {
    if (currentView === 'conversation') {
      setCurrentView('conversations');
      setSelectedConversation(null);
      onClearTargetUser?.(); // Clear targetUserId when going back from a conversation
      onRefreshConversations?.(); // Refresh conversations to update unread counts
    } else if (currentView === 'new-message') {
      setCurrentView('conversations');
    }
  };

  // Handle conversation start from new message
  const handleConversationStart = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setCurrentView('conversation');
  };

  // Handle messages being read
  const handleMessagesRead = () => {
    // Trigger immediate refresh of conversations and message count
    onRefreshConversations?.();
  };

  // Create or get conversation with target user when targetUserId is provided
  const createConversationWithTargetUser = async () => {
    if (!targetUserId || !currentUserId) {
      return;
    }
    
    setLoading(true);
    
    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.error('Conversation creation timed out');
      setLoading(false);
      // Don't create a fallback conversation - just show error
      setCurrentView('conversations');
    }, 10000); // 10 second timeout
    
    try {
      // First, get or create the conversation
      const conversationData = await messagingService.getOrCreateConversation(currentUserId, targetUserId);

      if (!conversationData || !conversationData.id) {
        throw new Error('Invalid conversation data returned');
      }

      // Try to fetch the target user's information
      let targetUser = null;
      try {
        const userResponse = await fetch(`http://localhost:5000/api/users/${targetUserId}`);
        
        if (userResponse.ok) {
          targetUser = await userResponse.json();
        } else {
          const errorText = await userResponse.text();
          console.error('User fetch failed:', errorText);
        }
      } catch (userError) {
        console.error('Error fetching user info:', userError);
      }

      // Create a properly structured conversation object
      const conversation: Conversation = {
        id: conversationData.id,
        other_user: {
          id: targetUserId,
          display_name: targetUser?.display_name || targetUser?.email?.split('@')[0] || 'User',
          email: targetUser?.email || '',
          avatar: targetUser?.avatar || '',
          user_type: targetUser?.user_type || 'user'
        },
        created_at: conversationData.created_at,
        updated_at: conversationData.updated_at,
        last_message_at: conversationData.last_message_at
      };

      clearTimeout(timeoutId);
      setSelectedConversation(conversation);
      setCurrentView('conversation');
    } catch (error) {
      console.error('Failed to create conversation with target user:', error);
      clearTimeout(timeoutId);
      // Don't create a fallback conversation - just show error and go back to conversations list
      setCurrentView('conversations');
    } finally {
      setLoading(false);
    }
  };

  // Effect to handle targetUserId - this should run immediately when targetUserId is provided
  useEffect(() => {
    if (targetUserId && currentUserId) {
      // Set loading state immediately
      setLoading(true);
      createConversationWithTargetUser();
    } else {
      // Reset to conversations list if no targetUserId
      setCurrentView('conversations');
      setSelectedConversation(null);
    }
  }, [targetUserId, currentUserId]);

  // Show loading state while creating conversation
  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0e9591] mx-auto mb-4"></div>
          <p className="text-muted-foreground">Opening conversation...</p>
        </div>
      </div>
    );
  }

  // If we have a targetUserId but no conversation yet, show loading
  if (targetUserId && !selectedConversation) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0e9591] mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    );
  }

  // Render based on current view
  switch (currentView) {
    case 'conversation':
      return selectedConversation ? (
        <ConversationView
          conversation={selectedConversation}
          currentUserId={currentUserId}
          onBack={handleBack}
          onMessagesRead={handleMessagesRead}
        />
      ) : (
        <ConversationsList
          currentUserId={currentUserId}
          onConversationSelect={handleConversationSelect}
          onNewMessage={handleNewMessage}
          onRefresh={onRefreshConversations}
        />
      );

    case 'new-message':
      return (
        <NewMessageView
          currentUserId={currentUserId}
          onBack={handleBack}
          onConversationStart={handleConversationStart}
        />
      );

    default:
      return (
        <ConversationsList
          currentUserId={currentUserId}
          onConversationSelect={handleConversationSelect}
          onNewMessage={handleNewMessage}
          onRefresh={onRefreshConversations}
        />
      );
  }
};
