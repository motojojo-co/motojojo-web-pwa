import { supabase } from "@/integrations/supabase/client";
import { Event } from "./eventService";

export interface CommunityLeadProfile {
  id: string;
  email: string;
  full_name: string;
  community_lead_username: string;
  community_lead_city: string;
  community_lead_bio: string;
  community_lead_is_active: boolean;
  community_lead_is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommunityLeadEvent {
  id: string;
  event_id: string;
  community_lead_id: string;
  assigned_at: string;
  events: Event;
}

export interface CommunityLeadActivity {
  id: string;
  community_lead_id: string;
  activity_type: string;
  activity_description: string;
  event_id?: string;
  metadata: any;
  created_at: string;
}

// Get community lead's events
export const getCommunityLeadEvents = async (communityLeadId: string): Promise<Event[]> => {
  try {
    const { data, error } = await supabase
      .from('community_lead_events')
      .select(`
        event_id,
        events (
          id,
          title,
          subtitle,
          description,
          long_description,
          date,
          time,
          duration,
          category,
          venue,
          city,
          address,
          price,
          image,
          images,
          gallery,
          featured,
          created_by,
          is_published,
          is_private,
          created_at,
          event_type,
          host,
          updated_at,
          has_discount,
          real_price,
          discounted_price,
          base_price,
          gst,
          convenience_fee,
          subtotal,
          ticket_price,
          location_map_link,
          offers,
          seats_available,
          doors_open_time,
          show_start_time,
          nearest_station,
          address_reveal_note,
          late_arrival_note,
          alcohol_available,
          bar_available,
          food_policy,
          seating_type,
          indoor_outdoor,
          accessibility_info,
          parking_info,
          additional_info,
          custom_tags
        )
      `)
      .eq('community_lead_id', communityLeadId);

    if (error) throw error;
    return data?.map(item => item.events).filter(Boolean) || [];
  } catch (error) {
    console.error("Error fetching community lead events:", error);
    throw error;
  }
};

// Assign event to community lead
export const assignEventToCommunityLead = async (eventId: string, communityLeadId: string) => {
  try {
    const { data, error } = await supabase
      .from('community_lead_events')
      .insert({
        event_id: eventId,
        community_lead_id: communityLeadId
      })
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await logCommunityLeadActivity(
      communityLeadId,
      'event_assigned',
      `Event assigned to community lead`,
      eventId
    );

    return data;
  } catch (error) {
    console.error("Error assigning event to community lead:", error);
    throw error;
  }
};

// Create event for community lead
export const createEventForCommunityLead = async (eventData: any, communityLeadId: string) => {
  try {
    // First create the event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert(eventData)
      .select()
      .single();

    if (eventError) throw eventError;

    // Then assign it to the community lead
    await assignEventToCommunityLead(event.id, communityLeadId);

    // Log activity
    await logCommunityLeadActivity(
      communityLeadId,
      'event_created',
      `Created event: ${event.title}`,
      event.id,
      { event_title: event.title, event_city: event.city }
    );

    return event;
  } catch (error) {
    console.error("Error creating event for community lead:", error);
    throw error;
  }
};

// Update event for community lead
export const updateEventForCommunityLead = async (eventId: string, eventData: any, communityLeadId: string) => {
  try {
    // Verify the event belongs to this community lead
    const { data: ownership, error: ownershipError } = await supabase
      .from('community_lead_events')
      .select('id')
      .eq('event_id', eventId)
      .eq('community_lead_id', communityLeadId)
      .single();

    if (ownershipError || !ownership) {
      throw new Error('Event not found or not owned by this community lead');
    }

    // Update the event
    const { data, error } = await supabase
      .from('events')
      .update(eventData)
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await logCommunityLeadActivity(
      communityLeadId,
      'event_updated',
      `Updated event: ${data.title}`,
      eventId,
      { event_title: data.title, changes: Object.keys(eventData) }
    );

    return data;
  } catch (error) {
    console.error("Error updating event for community lead:", error);
    throw error;
  }
};

// Delete event for community lead (only if owned)
export const deleteEventForCommunityLead = async (eventId: string, communityLeadId: string) => {
  try {
    // Verify ownership
    const { data: ownership, error: ownershipError } = await supabase
      .from('community_lead_events')
      .select('id')
      .eq('event_id', eventId)
      .eq('community_lead_id', communityLeadId)
      .single();

    if (ownershipError || !ownership) {
      throw new Error('Event not found or not owned by this community lead');
    }

    // Delete event
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) throw error;

    // Log activity
    await logCommunityLeadActivity(
      communityLeadId,
      'event_deleted',
      'Deleted event',
      eventId
    );

    return { success: true };
  } catch (error) {
    console.error('Error deleting event for community lead:', error);
    throw error;
  }
};

// Get community lead revenue
export const getCommunityLeadRevenue = async (communityLeadId: string) => {
  try {
    // Get all events for this community lead
    const events = await getCommunityLeadEvents(communityLeadId);
    const eventIds = events.map(event => event.id);

    if (eventIds.length === 0) {
      return {
        totalRevenue: 0,
        totalBookings: 0,
        revenueByEvent: []
      };
    }

    // Get bookings for these events
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .in('event_id', eventIds);

    if (error) throw error;

    const totalRevenue = bookings?.reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0;
    const totalBookings = bookings?.length || 0;
    
    // Calculate 10% commission for community lead
    const communityLeadCommission = Math.round(totalRevenue * 0.1);

    // Calculate revenue by event
    const revenueByEvent = events.map(event => {
      const eventBookings = bookings?.filter(booking => booking.event_id === event.id) || [];
      const eventRevenue = eventBookings.reduce((sum, booking) => sum + (booking.total_amount || 0), 0);
      const eventCommission = Math.round(eventRevenue * 0.1);
      
      return {
        event_id: event.id,
        event_title: event.title,
        revenue: eventRevenue,
        commission: eventCommission,
        bookings_count: eventBookings.length
      };
    });

    return {
      totalRevenue,
      totalBookings,
      communityLeadCommission,
      revenueByEvent
    };
  } catch (error) {
    console.error("Error fetching community lead revenue:", error);
    throw error;
  }
};

// Log community lead activity
export const logCommunityLeadActivity = async (
  communityLeadId: string,
  activityType: string,
  description: string,
  eventId?: string,
  metadata?: any
) => {
  try {
    const { data, error } = await supabase
      .from('community_lead_activity')
      .insert({
        community_lead_id: communityLeadId,
        activity_type: activityType,
        activity_description: description,
        event_id: eventId,
        metadata: metadata || {}
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error logging community lead activity:", error);
    throw error;
  }
};

// Get community lead activity
export const getCommunityLeadActivity = async (communityLeadId: string, limit: number = 50) => {
  try {
    const { data, error } = await supabase
      .from('community_lead_activity')
      .select(`
        *,
        events (
          id,
          title,
          city
        )
      `)
      .eq('community_lead_id', communityLeadId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching community lead activity:", error);
    throw error;
  }
};

// Get all community leads (admin only)
export const getAllCommunityLeads = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'community_lead')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching community leads:", error);
    throw error;
  }
};

// Get community lead activity for admin monitoring
export const getCommunityLeadActivityForAdmin = async (limit: number = 100) => {
  try {
    const { data, error } = await supabase
      .from('community_lead_activity')
      .select(`
        *,
        users!community_lead_activity_community_lead_id_fkey (
          id,
          full_name,
          community_lead_username,
          community_lead_city
        ),
        events (
          id,
          title,
          city
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching community lead activity for admin:", error);
    throw error;
  }
};

// Update community lead profile
export const updateCommunityLeadProfile = async (communityLeadId: string, profileData: Partial<CommunityLeadProfile>) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(profileData)
      .eq('id', communityLeadId)
      .eq('role', 'community_lead')
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await logCommunityLeadActivity(
      communityLeadId,
      'profile_updated',
      'Updated community lead profile',
      undefined,
      { updated_fields: Object.keys(profileData) }
    );

    return data;
  } catch (error) {
    console.error("Error updating community lead profile:", error);
    throw error;
  }
};

// Convert user to community lead (for Google OAuth users)
export const convertUserToCommunityLead = async (userId: string, userData: any) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        role: 'community_lead',
        full_name: userData.full_name || userData.user_metadata?.full_name || '',
        community_lead_username: userData.email?.split('@')[0] || 'user',
        community_lead_city: '',
        community_lead_bio: '',
        community_lead_is_active: true,
        community_lead_is_verified: false
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await logCommunityLeadActivity(
      userId,
      'account_created',
      'Joined as community lead via Google OAuth',
      undefined,
      { method: 'google_oauth' }
    );

    return data;
  } catch (error) {
    console.error("Error converting user to community lead:", error);
    throw error;
  }
};
