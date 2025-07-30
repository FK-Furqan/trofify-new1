# User Tagging System

## Overview

This feature implements a comprehensive Instagram/Facebook-style user tagging system that allows users to mention and tag other users in posts and comments. The system provides real-time notifications, clickable mentions, and seamless integration with the existing Trofify platform.

## 🎯 Core Features

### 📝 **Post & Comment Tagging**
- **@ Mention Detection**: Automatically detects @ mentions in text input
- **Real-time Search**: Live user search with avatar, username, and full name display
- **Multiple Tags**: Support for multiple user tags in a single post/comment
- **Smart Matching**: Matches users by display name or email username
- **Tag Limits**: Configurable maximum tags per post (10) and comment (5)

### 🎨 **User Experience**
- **Instagram-like Interface**: Familiar dropdown with user avatars and info
- **Keyboard Navigation**: Arrow keys, Enter, and Escape support
- **Clickable Tags**: Tagged users appear as clickable badges with avatars
- **Responsive Design**: Works seamlessly on mobile and desktop
- **Visual Feedback**: Clear indication of selected users and tag status

### 🔔 **Real-time Notifications**
- **Instant Alerts**: Real-time notifications via Socket.IO
- **Rich Content**: Includes tagging user's name, avatar, and post context
- **Direct Navigation**: Click notifications to go directly to the tagged post
- **Notification Types**: Dedicated 'tag' notification type in database

## 🏗️ Database Schema

### New Tables Created

#### `post_tags` Table
```sql
CREATE TABLE post_tags (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tagged_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tagged_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, tagged_user_id)
);
```

#### `comment_tags` Table
```sql
CREATE TABLE comment_tags (
    id SERIAL PRIMARY KEY,
    comment_id INTEGER NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
    tagged_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tagged_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(comment_id, tagged_user_id)
);
```

### Updated Tables

#### `notifications` Table
- Added support for 'tag' notification type
- Enhanced to handle tagging-specific notifications

## 🔧 Components

### 1. **UserMentionInput Component**
**Location**: `src/components/UserMentionInput.tsx`

**Features**:
- Real-time @ mention detection
- Debounced user search (300ms delay)
- Keyboard navigation support
- Tagged user display with badges
- Responsive dropdown interface

**Props**:
```typescript
interface UserMentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onTaggedUsersChange?: (users: User[]) => void;
  maxTags?: number;
}
```

### 2. **TaggedUsersRenderer Component**
**Location**: `src/components/TaggedUsersRenderer.tsx`

**Features**:
- Renders text with clickable user mentions
- Supports both default and compact variants
- Handles multiple mentions in same text
- Graceful fallback for invalid mentions

**Props**:
```typescript
interface TaggedUsersRendererProps {
  text: string;
  taggedUsers: User[];
  onUserClick?: (user: User) => void;
  className?: string;
  variant?: 'default' | 'compact';
}
```

## 🚀 API Endpoints

### User Search
```
GET /api/users/search?q={query}&current_user_id={userId}
```
- Searches users by display name or email
- Excludes current user from results
- Returns up to 20 matching users

### Post Tagging
```
POST /api/posts
```
**Enhanced to include**:
```json
{
  "user_id": "uuid",
  "description": "text",
  "images": ["urls"],
  "taggedUsers": [
    {
      "id": "uuid",
      "display_name": "string",
      "email": "string",
      "avatar": "url"
    }
  ]
}
```

### Comment Tagging
```
POST /api/posts/{post_id}/comments
```
**Enhanced to include**:
```json
{
  "user_id": "uuid",
  "comment": "text",
  "taggedUsers": [user_objects]
}
```

### Tagged Users Retrieval
```
GET /api/posts/{post_id}/tagged-users
```
- Returns all users tagged in a specific post

## 🔄 Integration Points

### 1. **CreatePost Component**
- Replaced Textarea with UserMentionInput
- Added tagged users state management
- Enhanced post creation to include tagged users

### 2. **PostCard Component**
- Integrated TaggedUsersRenderer for post content
- Displays tagged users as clickable mentions
- Maintains existing functionality

### 3. **CommentModal Component**
- Added UserMentionInput for comment creation
- Integrated CompactTaggedUsersRenderer for comment display
- Enhanced comment submission with tagging support

### 4. **Backend Integration**
- Updated post and comment creation endpoints
- Added real-time notification system
- Enhanced data retrieval with tagged users

## 🎨 User Interface

### Tagging Flow
1. **Type @**: User types @ followed by characters
2. **Search Dropdown**: Real-time user search appears
3. **Select User**: Click or use keyboard to select user
4. **Tag Display**: Selected user appears as clickable tag
5. **Submit**: Post/comment includes tagged users

### Visual Elements
- **Search Dropdown**: Dark overlay with user cards
- **User Cards**: Avatar, name, email, and user type
- **Tag Badges**: Small avatars with usernames
- **Clickable Mentions**: Blue text with hover effects

## 🔔 Notification System

### Real-time Notifications
- **Socket.IO Integration**: Instant delivery via WebSocket
- **Rich Content**: Includes user avatar and post context
- **Direct Links**: Click to navigate to tagged post
- **Notification Types**: Dedicated 'tag' type for filtering

### Notification Content
```json
{
  "type": "tag",
  "message": "John Doe tagged you in a post",
  "post_id": 123,
  "actor": {
    "id": "uuid",
    "display_name": "John Doe",
    "avatar": "url"
  }
}
```

## 🛡️ Security & Performance

### Security Features
- **User Validation**: Only valid users can be tagged
- **Permission Checks**: Users can only tag existing users
- **Input Sanitization**: Proper text processing and validation
- **Rate Limiting**: Built-in debouncing for search requests

### Performance Optimizations
- **Debounced Search**: 300ms delay to reduce API calls
- **Indexed Queries**: Database indexes on tag tables
- **Efficient Joins**: Optimized queries for user data
- **Caching**: User search results cached in component state

## 📱 Mobile Support

### Responsive Design
- **Touch-Friendly**: Large touch targets for mobile
- **Keyboard Support**: Virtual keyboard navigation
- **Viewport Optimization**: Proper sizing for mobile screens
- **Gesture Support**: Touch interactions for tag selection

## 🔧 Configuration

### Environment Variables
No additional environment variables required - uses existing backend configuration.

### Customization Options
- **Max Tags**: Configurable limits per post/comment
- **Search Delay**: Adjustable debounce timing
- **UI Variants**: Default and compact rendering modes
- **Notification Types**: Extensible notification system

## 🧪 Testing

### Manual Testing Checklist
- [ ] @ mention detection in posts
- [ ] @ mention detection in comments
- [ ] User search functionality
- [ ] Keyboard navigation
- [ ] Tag selection and removal
- [ ] Real-time notifications
- [ ] Clickable mention navigation
- [ ] Mobile responsiveness
- [ ] Multiple tags in single post
- [ ] Tag limits enforcement

### Edge Cases Handled
- Invalid usernames in mentions
- Duplicate tags
- Empty search queries
- Network failures
- User not found scenarios
- Maximum tag limits

## 🚀 Deployment

### Database Migration
The system automatically creates required tables via Supabase migrations:
- `post_tags` table
- `comment_tags` table
- Updated `notifications` table constraints

### Frontend Deployment
No additional build steps required - components are included in the main bundle.

## 📈 Future Enhancements

### Potential Improvements
- **Tag Suggestions**: AI-powered user suggestions
- **Tag Analytics**: Track most tagged users
- **Tag Filters**: Filter posts by tagged users
- **Bulk Tagging**: Tag multiple users at once
- **Tag History**: Recent tags for quick selection
- **Tag Permissions**: Control who can tag whom

### Integration Opportunities
- **Story Tagging**: Extend to story features
- **Event Tagging**: Tag users in events
- **Group Tagging**: Tag users in group posts
- **Tag Notifications**: Customizable notification preferences

## 🐛 Troubleshooting

### Common Issues
1. **Tags not appearing**: Check user search API response
2. **Notifications not working**: Verify Socket.IO connection
3. **Database errors**: Ensure migration completed successfully
4. **Performance issues**: Check search debouncing settings

### Debug Information
- Check browser console for JavaScript errors
- Verify backend API responses
- Monitor Socket.IO connection status
- Review database query performance

## 📚 API Reference

### User Search Response
```json
[
  {
    "id": "uuid",
    "display_name": "John Doe",
    "email": "john@example.com",
    "avatar": "https://...",
    "user_type": "athlete"
  }
]
```

### Tagged Users Response
```json
[
  {
    "id": "uuid",
    "display_name": "Jane Smith",
    "email": "jane@example.com",
    "avatar": "https://...",
    "user_type": "coach"
  }
]
```

This comprehensive user tagging system provides a seamless, Instagram-like experience for mentioning users in posts and comments, with real-time notifications and excellent mobile support. 