import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowLeft, User } from "lucide-react";
import { messagingService, Conversation } from "@/lib/messagingService";
import { UniversalLoader } from "@/components/ui/universal-loader";

interface User {
  id: string;
  display_name: string;
  email: string;
  avatar: string;
  user_type: string;
}

interface NewMessageViewProps {
  currentUserId?: string;
  onBack: () => void;
  onConversationStart: (conversation: Conversation) => void;
}

export const NewMessageView = ({ 
  currentUserId, 
  onBack, 
  onConversationStart 
}: NewMessageViewProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // Search users
  const searchUsers = async (query: string) => {
    if (!query.trim() || !currentUserId) return;
    
    setSearching(true);
    try {
      // For now, we'll use a simple approach - you can enhance this later
      // This would typically call an API to search users
      const response = await fetch(`http://localhost:5000/api/users/search?q=${encodeURIComponent(query)}&current_user_id=${currentUserId}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to search users:', error);
      // For demo purposes, create some mock users
      setUsers([
        {
          id: 'user1',
          display_name: 'John Doe',
          email: 'john@example.com',
          avatar: '',
          user_type: 'athlete'
        },
        {
          id: 'user2',
          display_name: 'Jane Smith',
          email: 'jane@example.com',
          avatar: '',
          user_type: 'coach'
        }
      ]);
    } finally {
      setSearching(false);
    }
  };

  // Start conversation with user
  const startConversation = async (user: User) => {
    if (!currentUserId) return;
    
    try {
      const conversation = await messagingService.getOrCreateConversation(currentUserId, user.id);
      onConversationStart(conversation);
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        searchUsers(query);
      } else {
        setUsers([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h3 className="font-semibold text-foreground">New Message</h3>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="w-full pl-10"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-y-auto">
        {searching ? (
          <div className="p-4">
            <UniversalLoader count={5} />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <User className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchQuery ? 'No users found' : 'Search for users'}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery 
                ? 'Try adjusting your search terms' 
                : 'Enter a name or email to find someone to message'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {users.map((user) => (
              <div
                key={user.id}
                className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => startConversation(user)}
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>
                      {user.display_name[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {user.display_name}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {user.email}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {user.user_type}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 