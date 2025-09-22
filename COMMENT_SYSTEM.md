# Comment System for Event Detail Pages

This document describes the comment system implementation for event detail pages.

## Overview

The comment system allows users to add comments and replies to event pages. Comments are specific to each event and are not shared across different events.

## Features

- **Add Comments**: Users can add comments to event pages
- **Reply to Comments**: Users can reply to existing comments
- **Edit Comments**: Users can edit their own comments
- **Delete Comments**: Users can delete their own comments (soft delete)
- **Real-time Updates**: Comments are refreshed when new ones are added
- **Authentication Required**: Users must be signed in to add comments
- **Private Event Access**: Comments are only visible to users who have access to the event

## Database Schema

### event_comments table

```sql
CREATE TABLE event_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_edited BOOLEAN DEFAULT FALSE,
  parent_comment_id UUID REFERENCES event_comments(id) ON DELETE CASCADE,
  is_deleted BOOLEAN DEFAULT FALSE
);
```

## API Endpoints

The comment system uses Supabase Edge Functions:

- `GET /api/comments?event_id={eventId}` - Get all comments for an event
- `POST /api/comments` - Create a new comment
- `PUT /api/comments/{commentId}` - Update a comment
- `DELETE /api/comments/{commentId}` - Delete a comment

## Components

### CommentForm
- Handles comment creation
- Shows sign-in prompt for unauthenticated users
- Supports both top-level comments and replies

### CommentItem
- Displays individual comments
- Handles editing and deletion
- Shows replies in a nested structure
- Displays user information and timestamps

### CommentsSection
- Main container for all comments
- Manages comment loading and refreshing
- Integrates with the event detail page

## Integration

The comment system is integrated into the EventDetail page:

```tsx
<CommentsSection 
  eventId={event.id} 
  isLocalGathering={isLocalGathering}
/>
```

## Security

- Row Level Security (RLS) is enabled on the event_comments table
- Users can only view comments for events they have access to
- Users can only edit/delete their own comments
- Private event comments are only visible to invited users

## Styling

The comment system adapts to different event themes:
- Regular events: Standard styling
- Local Gathering events: Green theme with custom colors

## Usage

1. Navigate to any event detail page
2. Scroll down to the Comments section
3. Sign in if not already authenticated
4. Add a comment or reply to existing comments
5. Edit or delete your own comments as needed

## Development

To test the comment system:

1. Run the development server: `npm run dev`
2. Navigate to an event page: `http://localhost:8080/events/mumbai/addebaazi-mumbai-4th-october/e78e7cd6-2ec3-41e1-bd59-0ce463b699bb`
3. Sign in to your account
4. Add a comment to test the functionality

## Migration

To apply the database changes:

1. Run the migration: `supabase db push`
2. Deploy the Edge Function: `supabase functions deploy comments`
3. Update the Vite proxy configuration if needed
