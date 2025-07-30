import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface User {
  id: string;
  display_name: string;
  email: string;
  avatar?: string;
  user_type: string;
  sport?: string;
}

interface TaggedUsersRendererProps {
  text: string;
  taggedUsers: User[];
  onUserClick?: (user: User) => void;
  className?: string;
  variant?: 'default' | 'compact';
}

export const TaggedUsersRenderer: React.FC<TaggedUsersRendererProps> = ({
  text,
  taggedUsers,
  onUserClick,
  className = "",
  variant = 'default'
}) => {
  // Parse text and replace @mentions with clickable elements
  const renderTextWithMentions = () => {
    if (!text) return null;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // Find all @mentions in the text
    const mentionRegex = /@(\w+)/g;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      const mentionText = match[0];
      const username = match[1];
      const startIndex = match.index;
      const endIndex = startIndex + mentionText.length;

      // Add text before the mention
      if (startIndex > lastIndex) {
        parts.push(
          <span key={`text-${startIndex}`}>
            {text.substring(lastIndex, startIndex)}
          </span>
        );
      }

      // Find the tagged user
      const taggedUser = taggedUsers.find(user => 
        user.display_name.toLowerCase() === username.toLowerCase() ||
        user.email.split('@')[0].toLowerCase() === username.toLowerCase()
      );

      if (taggedUser) {
        // Render as clickable mention
        parts.push(
          <button
            key={`mention-${startIndex}`}
            onClick={() => onUserClick?.(taggedUser)}
            className="inline-flex items-center gap-1 text-primary hover:text-primary/80 font-medium transition-colors"
          >
            {variant === 'compact' ? (
              <span>@{taggedUser.display_name}</span>
            ) : (
              <>
                <Avatar className="w-4 h-4">
                  <AvatarImage src={taggedUser.avatar} />
                  <AvatarFallback className="text-xs">
                    {taggedUser.display_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>@{taggedUser.display_name}</span>
              </>
            )}
          </button>
        );
      } else {
        // Render as plain text if user not found
        parts.push(
          <span key={`plain-${startIndex}`} className="text-muted-foreground">
            {mentionText}
          </span>
        );
      }

      lastIndex = endIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <span key="text-end">
          {text.substring(lastIndex)}
        </span>
      );
    }

    return parts;
  };

  return (
    <div className={`whitespace-pre-wrap break-words ${className}`}>
      {renderTextWithMentions()}
    </div>
  );
};

// Compact version for comments and smaller text areas
export const CompactTaggedUsersRenderer: React.FC<TaggedUsersRendererProps> = (props) => {
  return <TaggedUsersRenderer {...props} variant="compact" />;
}; 