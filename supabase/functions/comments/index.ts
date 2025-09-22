import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Fetch user only for mutating requests
    let user: any | null = null
    if (req.method !== 'GET') {
      const {
        data: { user: fetchedUser },
      } = await supabaseClient.auth.getUser()
      user = fetchedUser
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const commentId = pathParts[pathParts.length - 1]

    switch (req.method) {
      case 'GET':
        // Get comments for an event
        const eventId = url.searchParams.get('event_id')
        if (!eventId) {
          return new Response(
            JSON.stringify({ error: 'Event ID is required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        const { data: comments, error: commentsError } = await supabaseClient
          .from('event_comments')
          .select(`*`)
          .eq('event_id', eventId)
          .eq('is_deleted', false)
          .is('parent_comment_id', null)
          .order('created_at', { ascending: true })

        if (commentsError) {
          throw commentsError
        }

        // Get replies for each comment
        const commentsWithReplies = await Promise.all(
          (comments || []).map(async (comment) => {
            const { data: replies, error: repliesError } = await supabaseClient
              .from('event_comments')
              .select(`*`)
              .eq('parent_comment_id', comment.id)
              .eq('is_deleted', false)
              .order('created_at', { ascending: true })

            if (repliesError) {
              console.error('Error fetching replies:', repliesError)
              return { ...comment, replies: [] }
            }

            return { ...comment, replies: replies || [] }
          })
        )

        return new Response(
          JSON.stringify(commentsWithReplies),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )

      case 'POST':
        // Create a new comment
        const { event_id, comment_text, parent_comment_id } = await req.json()

        if (!event_id || !comment_text) {
          return new Response(
            JSON.stringify({ error: 'Event ID and comment text are required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Check if user has access to the event
        const { data: event, error: eventError } = await supabaseClient
          .from('events')
          .select('is_private')
          .eq('id', event_id)
          .single()

        if (eventError) {
          throw eventError
        }

        if (event.is_private) {
          // Check if user has access to private event via email mapping
          const { data: userRow, error: userFetchError } = await supabaseClient
            .from('users')
            .select('email')
            .eq('id', user.id)
            .single()

          if (userFetchError || !userRow?.email) {
            return new Response(
              JSON.stringify({ error: 'User email not found' }),
              { 
                status: 403, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            )
          }

          const { data: invitation, error: invitationError } = await supabaseClient
            .from('event_invitations')
            .select('status')
            .eq('event_id', event_id)
            .eq('user_email', userRow.email)
            .single()

          if (invitationError || invitation?.status !== 'accepted') {
            return new Response(
              JSON.stringify({ error: 'Access denied to this private event' }),
              { 
                status: 403, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            )
          }
        }

        const { data: newComment, error: createError } = await supabaseClient
          .from('event_comments')
          .insert([{
            event_id,
            user_id: user.id,
            comment_text,
            parent_comment_id: parent_comment_id || null
          }])
          .select(`*`)
          .single()

        if (createError) {
          throw createError
        }

        return new Response(
          JSON.stringify(newComment),
          { 
            status: 201, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )

      case 'PUT':
        // Update a comment
        if (!commentId) {
          return new Response(
            JSON.stringify({ error: 'Comment ID is required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        const { comment_text: updatedText } = await req.json()

        if (!updatedText) {
          return new Response(
            JSON.stringify({ error: 'Comment text is required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Check if user owns the comment
        const { data: existingComment, error: fetchError } = await supabaseClient
          .from('event_comments')
          .select('user_id')
          .eq('id', commentId)
          .single()

        if (fetchError) {
          throw fetchError
        }

        if (existingComment.user_id !== user.id) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized to edit this comment' }),
            { 
              status: 403, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        const { data: updatedComment, error: updateError } = await supabaseClient
          .from('event_comments')
          .update({
            comment_text: updatedText,
            is_edited: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', commentId)
          .select(`
            *,
            user:user_id (
              id,
              email,
              user_metadata
            )
          `)
          .single()

        if (updateError) {
          throw updateError
        }

        return new Response(
          JSON.stringify(updatedComment),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )

      case 'DELETE':
        // Delete a comment (soft delete)
        if (!commentId) {
          return new Response(
            JSON.stringify({ error: 'Comment ID is required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Check if user owns the comment
        const { data: commentToDelete, error: deleteFetchError } = await supabaseClient
          .from('event_comments')
          .select('user_id')
          .eq('id', commentId)
          .single()

        if (deleteFetchError) {
          throw deleteFetchError
        }

        if (commentToDelete.user_id !== user.id) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized to delete this comment' }),
            { 
              status: 403, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        const { error: deleteError } = await supabaseClient
          .from('event_comments')
          .update({ is_deleted: true })
          .eq('id', commentId)

        if (deleteError) {
          throw deleteError
        }

        return new Response(
          JSON.stringify({ success: true }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { 
            status: 405, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }
  } catch (error) {
    console.error('Error in comments function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
