# Supporters/Supporting Feature

## Overview
The Supporters/Supporting feature allows users to follow each other, similar to Instagram's followers/following system. Users can support other users, and the supported user will receive a notification.

## Database Schema

### Tables Created

#### `supports` Table
- `id` (UUID, Primary Key): Unique identifier for each support relationship
- `supporter_id` (UUID): User who is supporting (references auth.users)
- `supported_id` (UUID): User being supported (references auth.users)
- `created_at` (Timestamp): When the support was created
- Unique constraint on (supporter_id, supported_id) to prevent duplicate supports

#### Updated `notifications` Table
- Added support for 'support' notification type
- When a user supports another user, a notification is created with:
  - `type`: 'support'
  - `message`: "{supporter_name} has started supporting you"
  - `actor_id`: The supporter's user ID
  - `user_id`: The supported user's ID

### Database Functions

#### `get_supporter_count(user_uuid UUID)`
Returns the number of supporters for a given user.

#### `get_supporting_count(user_uuid UUID)`
Returns the number of users that a given user is supporting.

#### `toggle_support(supporter_uuid UUID, supported_uuid UUID)`
Toggles the support relationship between two users:
- If support doesn't exist: Creates support relationship and notification
- If support exists: Removes support relationship
- Returns JSON with action type and updated counts

## Frontend Implementation

### Components Updated

#### `ProfileView.tsx`
- Added support button that changes from "Support" to "Supporting" when clicked
- Button color changes from teal (#0e9591) to gray (#6b7280) when supporting
- Polling-based updates of supporter and supporting counts
- Toast notifications for support actions
- Support counts displayed in profile header and About section

### New Service

#### `SupportService` (`src/lib/supportService.ts`)
- `toggleSupport()`: Toggle support/un-support relationship via backend API
- `getSupporterCount()`: Get supporter count for a user via backend API
- `getSupportingCount()`: Get supporting count for a user via backend API
- `isSupporting()`: Check if user A is supporting user B via backend API
- `subscribeToSupportChanges()`: Polling-based subscription to support changes
- `getSupportCounts()`: Get both supporter and supporting counts via backend API

### Backend API Endpoints

#### Support Endpoints (Backend)
- `POST /api/supports/toggle` - Toggle support/un-support relationship
- `GET /api/supports/supporter-count/:user_id` - Get supporter count
- `GET /api/supports/supporting-count/:user_id` - Get supporting count
- `POST /api/supports/check` - Check if user is supporting another user
- `GET /api/supports/counts/:user_id` - Get both supporter and supporting counts

### Security Features
- All Supabase operations go through secure backend endpoints
- No hardcoded credentials in frontend code
- Uses environment variables for database access
- Proper error handling and validation

## User Experience

### Support Button Behavior
1. **Initial State**: Shows "Support" in teal color
2. **After Click**: Changes to "Supporting" in gray color
3. **Loading State**: Shows "Loading..." and disables button
4. **Error Handling**: Shows error toast if action fails

### Notifications
- When User A supports User B:
  - User B receives notification: "{User A's name} has started supporting you"
  - Notification includes supporter's avatar, username, and user type

### Count Updates
- Supporter count increases for the supported user
- Supporting count increases for the supporter
- Counts update in real-time across all connected clients
- Counts are displayed in profile header and About section

## Security
- Row Level Security (RLS) enabled on supports table
- Users can only insert/delete their own support relationships
- All users can view support relationships for public profiles
- All database operations go through secure backend endpoints
- No hardcoded credentials in frontend code
- Uses environment variables for database access
- Proper input validation and error handling

## Testing
The feature has been tested with:
- Database functions working correctly
- Real-time updates functioning
- Support button state changes
- Notification creation
- Error handling

## Future Enhancements
- Support lists view (show all supporters/supporting)
- Support suggestions
- Support analytics
- Bulk support actions 