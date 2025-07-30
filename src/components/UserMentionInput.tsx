import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, AtSign, Search } from 'lucide-react';
import { getBackendUrl } from '@/lib/utils';
import axios from 'axios';

interface User {
  id: string;
  display_name: string;
  email: string;
  avatar?: string;
  user_type: string;
  sport?: string;
}

interface UserMentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onTaggedUsersChange?: (users: User[]) => void;
  maxTags?: number;
  currentUserId?: string;
}

interface TaggedUser {
  user: User;
  startIndex: number;
  endIndex: number;
  tagText: string;
}

export const UserMentionInput: React.FC<UserMentionInputProps> = ({
  value,
  onChange,
  placeholder = "What's on your mind?",
  className = "",
  onTaggedUsersChange,
  maxTags = 10,
  currentUserId
}) => {
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionResults, setMentionResults] = useState<User[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [taggedUsers, setTaggedUsers] = useState<TaggedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const mentionsRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Search users for mentions
  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setMentionResults([]);
      return;
    }

    if (!currentUserId) {
      console.error('Current user ID is required for user search');
      setMentionResults([]);
      return;
    }

    setIsLoading(true);
    try {
      console.log('Searching users with query:', query, 'currentUserId:', currentUserId);
      const response = await axios.get(`${getBackendUrl()}/api/users/search`, {
        params: {
          q: query,
          current_user_id: currentUserId,
          limit: 10
        }
      });
      
      console.log('Search response:', response.data);
      setMentionResults(response.data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setMentionResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchUsers(mentionQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [mentionQuery, searchUsers]);

  // Handle input change and detect @ mentions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Check for @ mentions
    const cursorPosition = e.target.selectionStart || 0;
    const textBeforeCursor = newValue.substring(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/);

    if (mentionMatch) {
      const query = mentionMatch[1];
      setMentionQuery(query);
      setMentionStartIndex(cursorPosition - query.length - 1); // -1 for @ symbol
      setShowMentions(true);
      setSelectedIndex(0);
      
      // If query is empty, show all users (or recent users)
      if (query.length === 0) {
        setMentionQuery('');
      }
    } else {
      setShowMentions(false);
      setMentionStartIndex(-1);
    }

    // Update tagged users
    updateTaggedUsers(newValue);
  };

  // Update tagged users from text
  const updateTaggedUsers = (text: string) => {
    const mentions = text.match(/@(\w+)/g) || [];
    const newTaggedUsers: TaggedUser[] = [];

    mentions.forEach((mention, index) => {
      const tagText = mention.substring(1); // Remove @
      const startIndex = text.indexOf(mention);
      const endIndex = startIndex + mention.length;

      // Find user in mention results or existing tagged users
      const user = mentionResults.find(u => 
        u.display_name.toLowerCase().includes(tagText.toLowerCase()) ||
        u.email.toLowerCase().includes(tagText.toLowerCase())
      ) || taggedUsers.find(tu => tu.tagText === tagText)?.user;

      if (user) {
        newTaggedUsers.push({
          user,
          startIndex,
          endIndex,
          tagText
        });
      }
    });

    setTaggedUsers(newTaggedUsers);
    
    // Notify parent component
    if (onTaggedUsersChange) {
      onTaggedUsersChange(newTaggedUsers.map(tu => tu.user));
    }
  };

  // Handle user selection from mentions dropdown
  const handleUserSelect = (user: User) => {
    if (!mentionStartIndex || mentionStartIndex < 0) return;

    const beforeMention = value.substring(0, mentionStartIndex);
    const afterMention = value.substring(mentionStartIndex + mentionQuery.length + 1); // +1 for @
    const newValue = `${beforeMention}@${user.display_name} ${afterMention}`;

    onChange(newValue);
    setShowMentions(false);
    setMentionStartIndex(-1);
    setMentionQuery('');

    // Focus back to input
    if (inputRef.current) {
      inputRef.current.focus();
      const newCursorPosition = beforeMention.length + user.display_name.length + 2; // +2 for @ and space
      inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
    }

    // Update tagged users
    updateTaggedUsers(newValue);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showMentions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < mentionResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : mentionResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (mentionResults[selectedIndex]) {
          handleUserSelect(mentionResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowMentions(false);
        setMentionStartIndex(-1);
        break;
    }
  };

  // Handle click outside to close mentions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mentionsRef.current &&
        !mentionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowMentions(false);
        setMentionStartIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Highlight search text in username
  const highlightText = (text: string, searchText: string) => {
    if (!searchText) return text;
    
    const regex = new RegExp(`(${searchText})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 dark:bg-yellow-800 font-semibold">
          {part}
        </span>
      ) : part
    );
  };

  // Render tagged users as badges
  const renderTaggedUsers = () => {
    if (taggedUsers.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {taggedUsers.map((taggedUser, index) => (
          <Badge
            key={`${taggedUser.user.id}-${index}`}
            variant="secondary"
            className="flex items-center gap-1 px-2 py-1 text-sm"
          >
            <Avatar className="w-4 h-4">
              <AvatarImage src={taggedUser.user.avatar} />
              <AvatarFallback className="text-xs">
                {taggedUser.user.display_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span>@{taggedUser.user.display_name}</span>
            <button
              onClick={() => {
                // Remove the tag from text
                const beforeTag = value.substring(0, taggedUser.startIndex);
                const afterTag = value.substring(taggedUser.endIndex);
                const newValue = beforeTag + afterTag;
                onChange(newValue);
                updateTaggedUsers(newValue);
              }}
              className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pr-10"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
          <AtSign className="w-4 h-4" />
        </div>
      </div>

      {/* Tagged Users Display */}
      {renderTaggedUsers()}

      {/* Mentions Dropdown */}
      {showMentions && (
        <div
          ref={mentionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-hidden"
        >
          <div className="p-2 border-b border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Search className="w-4 h-4" />
              <span>Searching for "{mentionQuery}"</span>
            </div>
          </div>
          
          <ScrollArea className="max-h-48">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm">Searching users...</p>
              </div>
            ) : mentionResults.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <p className="text-sm">No users found</p>
              </div>
            ) : (
              <div className="py-1">
                {mentionResults.map((user, index) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className={`w-full px-3 py-2 text-left hover:bg-muted transition-colors flex items-center gap-3 ${
                      index === selectedIndex ? 'bg-muted' : ''
                    }`}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>
                        {user.display_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {highlightText(user.display_name, mentionQuery)}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        @{highlightText(user.email.split('@')[0], mentionQuery)} • {user.sport || user.user_type}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          {mentionResults.length > 0 && (
            <div className="p-2 border-t border-border text-xs text-muted-foreground">
              Use ↑↓ to navigate, Enter to select, Esc to cancel
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 