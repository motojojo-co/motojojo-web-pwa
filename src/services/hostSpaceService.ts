import { supabase } from "@/integrations/supabase/client";
import { sendEmail } from "./emailService";

export interface HostSpace {
  id: string;
  host_id: string;
  name: string;
  description?: string;
  location: string;
  city: string;
  address: string;
  images: string[];
  capacity?: number;
  amenities?: string[];
  available_dates?: string[];
  available_start_time?: string;
  available_end_time?: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface HostEventRequest {
  id: string;
  host_space_id: string;
  host_id: string;
  event_title: string;
  event_description?: string;
  requested_date: string;
  requested_start_time: string;
  requested_end_time?: string;
  expected_capacity?: number;
  event_category?: string;
  status: 'pending' | 'approved' | 'rejected' | 'scheduled';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_event_id?: string;
  created_at: string;
  updated_at: string;
  host_space?: HostSpace;
}

export interface CreateHostSpaceInput {
  name: string;
  description?: string;
  location: string;
  city: string;
  address: string;
  images?: string[];
  capacity?: number;
  amenities?: string[];
  available_dates?: string[];
  available_start_time?: string;
  available_end_time?: string;
}

export interface CreateEventRequestInput {
  host_space_id: string;
  event_title: string;
  event_description?: string;
  requested_date: string;
  requested_start_time: string;
  requested_end_time?: string;
  expected_capacity?: number;
  event_category?: string;
}

// Get current host's spaces
export const getHostSpaces = async (): Promise<HostSpace[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('User not authenticated');
    return [];
  }

  const { data: hostProfile } = await supabase
    .from('hosts')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!hostProfile) {
    console.error('Host profile not found');
    return [];
  }

  const { data, error } = await supabase
    .from('host_spaces')
    .select('*')
    .eq('host_id', hostProfile.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching host spaces:', error);
    return [];
  }

  return data || [];
};

// Get a single host space
export const getHostSpace = async (spaceId: string): Promise<HostSpace | null> => {
  const { data, error } = await supabase
    .from('host_spaces')
    .select('*')
    .eq('id', spaceId)
    .single();

  if (error) {
    console.error('Error fetching host space:', error);
    return null;
  }

  return data;
};

// Create a new host space
export const createHostSpace = async (input: CreateHostSpaceInput): Promise<{ success: boolean; space?: HostSpace; error?: string }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  const { data: hostProfile } = await supabase
    .from('hosts')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!hostProfile) {
    return { success: false, error: 'Host profile not found' };
  }

  const { data, error } = await supabase
    .from('host_spaces')
    .insert({
      host_id: hostProfile.id,
      ...input,
      images: input.images || [],
      amenities: input.amenities || [],
      available_dates: input.available_dates || [],
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating host space:', error);
    return { success: false, error: error.message };
  }

  // Send notification (don't await to avoid blocking)
  sendHostSpaceNotification(data, 'created', user.email).catch(err => 
    console.error('Failed to send notification:', err)
  );

  return { success: true, space: data };
};

// Update a host space
export const updateHostSpace = async (spaceId: string, input: Partial<CreateHostSpaceInput>): Promise<{ success: boolean; space?: HostSpace; error?: string }> => {
  const { data, error } = await supabase
    .from('host_spaces')
    .update(input)
    .eq('id', spaceId)
    .select()
    .single();

  if (error) {
    console.error('Error updating host space:', error);
    return { success: false, error: error.message };
  }

  return { success: true, space: data };
};

// Delete a host space
export const deleteHostSpace = async (spaceId: string): Promise<{ success: boolean; error?: string }> => {
  const { error } = await supabase
    .from('host_spaces')
    .delete()
    .eq('id', spaceId);

  if (error) {
    console.error('Error deleting host space:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

// Get events for a host's spaces
export const getEventsAtHostSpaces = async (): Promise<any[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }

  const { data: hostProfile } = await supabase
    .from('hosts')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!hostProfile) {
    return [];
  }

  // Get all approved spaces for this host
  const { data: spaces } = await supabase
    .from('host_spaces')
    .select('id, name, location')
    .eq('host_id', hostProfile.id)
    .eq('status', 'approved');

  if (!spaces || spaces.length === 0) {
    return [];
  }

  const spaceIds = spaces.map(s => s.id);

  // Get all events that have this host's spaces location or were requested at these spaces
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .eq('host', hostProfile.id)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching events at host spaces:', error);
    return [];
  }

  // Also get events from event requests that were scheduled
  const { data: scheduledRequests } = await supabase
    .from('host_event_requests')
    .select(`
      *,
      host_spaces (*)
    `)
    .eq('host_id', hostProfile.id)
    .eq('status', 'scheduled')
    .not('created_event_id', 'is', null);

  return events || [];
};

// Get host's event requests
export const getHostEventRequests = async (): Promise<HostEventRequest[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }

  const { data: hostProfile } = await supabase
    .from('hosts')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!hostProfile) {
    return [];
  }

  const { data, error } = await supabase
    .from('host_event_requests')
    .select(`
      *,
      host_spaces (*)
    `)
    .eq('host_id', hostProfile.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching event requests:', error);
    return [];
  }

  return data || [];
};

// Create an event request
export const createEventRequest = async (input: CreateEventRequestInput): Promise<{ success: boolean; request?: HostEventRequest; error?: string }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  const { data: hostProfile } = await supabase
    .from('hosts')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!hostProfile) {
    return { success: false, error: 'Host profile not found' };
  }

  // Verify the space belongs to this host
  const { data: space } = await supabase
    .from('host_spaces')
    .select('id, status')
    .eq('id', input.host_space_id)
    .eq('host_id', hostProfile.id)
    .single();

  if (!space) {
    return { success: false, error: 'Host space not found' };
  }

  if (space.status !== 'approved') {
    return { success: false, error: 'Host space must be approved before requesting events' };
  }

  const { data, error } = await supabase
    .from('host_event_requests')
    .insert({
      host_space_id: input.host_space_id,
      host_id: hostProfile.id,
      ...input,
      status: 'pending'
    })
    .select(`
      *,
      host_spaces (*)
    `)
    .single();

  if (error) {
    console.error('Error creating event request:', error);
    return { success: false, error: error.message };
  }

  // Send notification (don't await to avoid blocking)
  sendEventRequestNotification(data, 'created', user.email).catch(err => 
    console.error('Failed to send notification:', err)
  );

  return { success: true, request: data };
};

// Admin: Get all pending host spaces
export const getPendingHostSpaces = async (): Promise<HostSpace[]> => {
  const { data, error } = await supabase
    .from('host_spaces')
    .select(`
      *,
      hosts (
        id,
        host_name,
        user_id,
        users (
          email
        )
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending host spaces:', error);
    return [];
  }

  return data || [];
};

// Admin: Get all pending event requests
export const getPendingEventRequests = async (): Promise<HostEventRequest[]> => {
  const { data, error } = await supabase
    .from('host_event_requests')
    .select(`
      *,
      host_spaces (*),
      hosts (
        id,
        host_name,
        user_id,
        users (
          email
        )
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending event requests:', error);
    return [];
  }

  return data || [];
};

// Admin: Approve/reject host space
export const approveHostSpace = async (spaceId: string, status: 'approved' | 'rejected', rejectionReason?: string): Promise<{ success: boolean; error?: string }> => {
  const { data, error } = await supabase.rpc('approve_host_space', {
    space_id: spaceId,
    approval_status: status,
    rejection_reason: rejectionReason || null
  });

  if (error) {
    console.error('Error approving host space:', error);
    return { success: false, error: error.message };
  }

  if (data && !data.success) {
    return { success: false, error: data.error };
  }

  return { success: true };
};

// Admin: Approve/reject event request
export const approveEventRequest = async (requestId: string, status: 'approved' | 'rejected' | 'scheduled', rejectionReason?: string): Promise<{ success: boolean; error?: string }> => {
  const { data, error } = await supabase.rpc('approve_event_request', {
    request_id: requestId,
    approval_status: status,
    rejection_reason: rejectionReason || null
  });

  if (error) {
    console.error('Error approving event request:', error);
    return { success: false, error: error.message };
  }

  if (data && !data.success) {
    return { success: false, error: data.error };
  }

  return { success: true };
};

// Notification helper: Get all admin and community lead emails
const getAdminAndCommunityLeadEmails = async (): Promise<string[]> => {
  const { data: admins } = await supabase
    .from('users')
    .select('email')
    .eq('role', 'admin');

  const { data: communityLeads } = await supabase
    .from('users')
    .select('email')
    .eq('role', 'community_lead');

  const emails: string[] = [];
  if (admins) emails.push(...admins.map(a => a.email).filter(Boolean));
  if (communityLeads) emails.push(...communityLeads.map(cl => cl.email).filter(Boolean));
  
  return [...new Set(emails)]; // Remove duplicates
};

// Send notification emails for host space updates
export const sendHostSpaceNotification = async (
  space: HostSpace,
  action: 'created' | 'approved' | 'rejected',
  hostEmail?: string
): Promise<void> => {
  try {
    const emails = await getAdminAndCommunityLeadEmails();
    if (hostEmail) emails.push(hostEmail);

    const subject = `Host Space ${action === 'created' ? 'Submitted' : action === 'approved' ? 'Approved' : 'Rejected'}: ${space.name}`;
    
    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Host Space Update</h2>
        <p>The host space "<strong>${space.name}</strong>" has been ${action === 'created' ? 'submitted for approval' : action}.</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>Space Details:</h3>
          <p><strong>Location:</strong> ${space.location}, ${space.city}</p>
          <p><strong>Address:</strong> ${space.address}</p>
          ${space.capacity ? `<p><strong>Capacity:</strong> ${space.capacity}</p>` : ''}
          ${space.description ? `<p><strong>Description:</strong> ${space.description}</p>` : ''}
        </div>
        ${action === 'rejected' && space.rejection_reason ? `<p><strong>Rejection Reason:</strong> ${space.rejection_reason}</p>` : ''}
      </div>
    `;

    // Send emails
    await Promise.all(
      emails.map(email => 
        sendEmail({
          to: email,
          subject,
          html
        }).catch(err => console.error(`Failed to send email to ${email}:`, err))
      )
    );
  } catch (error) {
    console.error('Error sending host space notifications:', error);
  }
};

// Send notification emails for event request updates
export const sendEventRequestNotification = async (
  request: HostEventRequest,
  action: 'created' | 'approved' | 'rejected' | 'scheduled',
  hostEmail?: string
): Promise<void> => {
  try {
    const emails = await getAdminAndCommunityLeadEmails();
    if (hostEmail) emails.push(hostEmail);

    const subject = `Event Request ${action === 'created' ? 'Submitted' : action.charAt(0).toUpperCase() + action.slice(1)}: ${request.event_title}`;
    
    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Event Request Update</h2>
        <p>The event request "<strong>${request.event_title}</strong>" has been ${action === 'created' ? 'submitted for approval' : action}.</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>Event Details:</h3>
          <p><strong>Date:</strong> ${new Date(request.requested_date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${request.requested_start_time}${request.requested_end_time ? ` - ${request.requested_end_time}` : ''}</p>
          ${request.event_description ? `<p><strong>Description:</strong> ${request.event_description}</p>` : ''}
          ${request.expected_capacity ? `<p><strong>Expected Capacity:</strong> ${request.expected_capacity}</p>` : ''}
        </div>
        ${action === 'rejected' && request.rejection_reason ? `<p><strong>Rejection Reason:</strong> ${request.rejection_reason}</p>` : ''}
      </div>
    `;

    // Send emails
    await Promise.all(
      emails.map(email => 
        sendEmail({
          to: email,
          subject,
          html
        }).catch(err => console.error(`Failed to send email to ${email}:`, err))
      )
    );
  } catch (error) {
    console.error('Error sending event request notifications:', error);
  }
};

