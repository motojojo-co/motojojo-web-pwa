export interface Comment {
  id: string;
  event_id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  parent_comment_id?: string;
  is_deleted: boolean;
  user?: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
      name?: string;
    };
  };
  replies?: Comment[];
}

export interface CreateCommentData {
  event_id: string;
  comment_text: string;
  parent_comment_id?: string;
}

export interface UpdateCommentData {
  comment_text: string;
}

import { supabase } from '@/integrations/supabase/client';

// Use local proxy in dev, call Supabase Edge Function directly in prod
const API_BASE_URL = import.meta.env.DEV
  ? '/api/comments'
  : 'https://vibruvwwwxqtagmlkodq.supabase.co/functions/v1/comments';
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpYnJ1dnd3d3hxdGFnbWxrb2RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NjEyODIsImV4cCI6MjA2MDIzNzI4Mn0.7s_NqBKDjAvtfr7GKPPMhqizUh9VbAfOY4j2lrE3p7A";

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || SUPABASE_ANON_KEY;
    return { 'Authorization': `Bearer ${token}` };
  } catch {
    return { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` };
  }
};

/**
 * Get all comments for a specific event
 */
export const getEventComments = async (eventId: string): Promise<Comment[]> => {
  try {
    const auth = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}?event_id=${eventId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...auth,
      },
    });

    // If edge function is unavailable locally (404), fall back to direct table query
    if (response.status === 404) {
      const { data: comments, error } = await supabase
        .from('event_comments')
        .select(`*`)
        .eq('event_id', eventId)
        .eq('is_deleted', false)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: true });

      if (error) throw error as unknown as Error;

      // Fetch replies for each comment to match edge function response shape
      const withReplies: Comment[] = await Promise.all(
        (comments || []).map(async (comment: any) => {
          const { data: replies } = await supabase
            .from('event_comments')
            .select(`*`)
            .eq('parent_comment_id', comment.id)
            .eq('is_deleted', false)
            .order('created_at', { ascending: true });
          return { ...comment, replies: replies || [] } as Comment;
        })
      );

      return withReplies;
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch comments: ${response.statusText}`);
    }

    const comments = await response.json();
    return comments;
  } catch (error) {
    console.error('Error in getEventComments:', error);
    throw error;
  }
};

/**
 * Create a new comment
 */
export const createComment = async (commentData: CreateCommentData): Promise<Comment> => {
  try {
    const auth = await getAuthHeaders();
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...auth,
      },
      body: JSON.stringify(commentData),
    });

    // If edge function route is missing locally, write directly to table
    if (response.status === 404) {
      const { data: sessionData } = await supabase.auth.getUser();
      const user = sessionData?.user;
      if (!user) {
        throw new Error('Unauthorized');
      }

      const { data: inserted, error } = await supabase
        .from('event_comments')
        .insert([
          {
            event_id: commentData.event_id,
            user_id: user.id,
            comment_text: commentData.comment_text,
            parent_comment_id: commentData.parent_comment_id || null,
          },
        ])
        .select(`*`)
        .single();

      if (error) throw error as unknown as Error;
      return inserted as unknown as Comment;
    }

    const comment = await response.json();
    return comment;
  } catch (error) {
    console.error('Error in createComment:', error);
    throw error;
  }
};

/**
 * Update an existing comment
 */
export const updateComment = async (commentId: string, updateData: UpdateCommentData): Promise<Comment> => {
  try {
    const auth = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/${commentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...auth,
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update comment: ${response.statusText}`);
    }

    const comment = await response.json();
    return comment;
  } catch (error) {
    console.error('Error in updateComment:', error);
    throw error;
  }
};

/**
 * Delete a comment (soft delete)
 */
export const deleteComment = async (commentId: string): Promise<void> => {
  try {
    const auth = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/${commentId}`, {
      method: 'DELETE',
      headers: { ...auth },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete comment: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error in deleteComment:', error);
    throw error;
  }
};

/**
 * Get comment count for an event
 */
export const getEventCommentCount = async (eventId: string): Promise<number> => {
  try {
    const comments = await getEventComments(eventId);
    return comments.length;
  } catch (error) {
    console.error('Error in getEventCommentCount:', error);
    throw error;
  }
};
