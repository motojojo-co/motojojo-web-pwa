import { supabase } from "@/integrations/supabase/client";
import { getAllUsers, User } from "@/services/userService";

export interface BulkEmailRequest {
  recipients: Array<{
    email: string;
    name?: string;
    customData?: Record<string, any>;
  }>;
  subject: string;
  html?: string;
  text?: string;
  template?: 'ticket' | 'announcement' | 'custom';
  eventData?: {
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    eventVenue: string;
  };
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
}

export interface BulkEmailResponse {
  success: boolean;
  totalSent: number;
  totalFailed: number;
  results: Array<{
    email: string;
    success: boolean;
    error?: string;
  }>;
}

export const sendBulkEmail = async (request: BulkEmailRequest): Promise<BulkEmailResponse> => {
  try {
    console.log('=== SENDING BULK EMAIL ===');
    console.log(`Sending to ${request.recipients.length} recipients`);
    
    // Try the Supabase edge function first
    try {
      const { data, error } = await supabase.functions.invoke('send-bulk-email', {
        body: {
          recipients: request.recipients,
          subject: request.subject,
          html: request.html,
          text: request.text,
          template: request.template,
          eventData: request.eventData
        }
      });

      if (error) {
        console.warn('Supabase edge function failed, falling back to individual emails:', error);
        throw error;
      }

      console.log('Bulk email response:', data);
      return data as BulkEmailResponse;
    } catch (edgeFunctionError) {
      console.log('Falling back to individual email sending...');
      
      // Fallback: Send emails individually using the existing email service
      const results: Array<{ email: string; success: boolean; error?: string }> = [];
      let totalSent = 0;
      let totalFailed = 0;

      // Process emails in smaller batches
      const batchSize = 3;
      const batches = [];
      
      for (let i = 0; i < request.recipients.length; i += batchSize) {
        batches.push(request.recipients.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        const batchPromises = batch.map(async (recipient) => {
          try {
            // Personalize the email content if name is provided
            let personalizedHtml = request.html;
            let personalizedText = request.text;
            
            if (recipient.name && request.html) {
              personalizedHtml = request.html.replace(/\$\{name\}/g, recipient.name);
            }
            if (recipient.name && request.text) {
              personalizedText = request.text.replace(/\$\{name\}/g, recipient.name);
            }

            // Use the send-email edge function with Spacemail
            const { data, error } = await supabase.functions.invoke('send-email', {
              body: {
                to: recipient.email,
                subject: request.subject,
                html: personalizedHtml,
                text: personalizedText
              }
            });

            if (error) {
              throw new Error(error.message || 'Failed to send email');
            }

            return { email: recipient.email, success: true };
          } catch (error: any) {
            console.error(`Failed to send email to ${recipient.email}:`, error);
            return { 
              email: recipient.email, 
              success: false, 
              error: error.message 
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Count successes and failures
        batchResults.forEach(result => {
          if (result.success) {
            totalSent++;
          } else {
            totalFailed++;
          }
        });

        // Add a delay between batches
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return {
        success: totalFailed === 0,
        totalSent,
        totalFailed,
        results
      };
    }

  } catch (error: any) {
    console.error('Error in bulk email service:', error);
    throw error;
  }
};

// Helper function to get all users for bulk email
export const getAllUsersForBulkEmail = async () => {
  try {
    console.log('Fetching users for bulk email...');
    // Use the existing userService to get users
    const users = await getAllUsers();
    console.log('Raw users from userService:', users);
    
    // Transform to match the expected format
    const transformedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.full_name || user.email.split('@')[0], // Use full_name or fallback to email prefix
      created_at: user.created_at
    }));
    
    console.log('Transformed users for bulk email:', transformedUsers);
    return transformedUsers;
  } catch (error) {
    console.error('Error fetching users for bulk email:', error);
    throw error;
  }
};

// Helper function to get users by event (for event-specific emails)
export const getUsersByEvent = async (eventId: string) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        email,
        name,
        booking_date,
        events (
          id,
          title,
          date,
          time,
          venue,
          city
        )
      `)
      .eq('event_id', eventId)
      .order('booking_date', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching users by event:', error);
    throw error;
  }
};

// Helper function to create announcement email template
export const createAnnouncementTemplate = (
  title: string,
  content: string,
  eventData?: {
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    eventVenue: string;
  }
) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #6A0DAD 0%, #8B5CF6 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">${title}</h1>
          <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Motojojo Events</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <div style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            ${content}
          </div>
          
          ${eventData ? `
          <!-- Event Details Card -->
          <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #6A0DAD;">
            <h2 style="color: #333; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">📅 Event Details</h2>
            <div style="display: grid; gap: 12px;">
              <div style="display: flex; align-items: center;">
                <span style="font-weight: 600; color: #6A0DAD; min-width: 80px;">Event:</span>
                <span style="color: #333;">${eventData.eventTitle}</span>
              </div>
              <div style="display: flex; align-items: center;">
                <span style="font-weight: 600; color: #6A0DAD; min-width: 80px;">Date:</span>
                <span style="color: #333;">${eventData.eventDate}</span>
              </div>
              <div style="display: flex; align-items: center;">
                <span style="font-weight: 600; color: #6A0DAD; min-width: 80px;">Time:</span>
                <span style="color: #333;">${eventData.eventTime}</span>
              </div>
              <div style="display: flex; align-items: center;">
                <span style="font-weight: 600; color: #6A0DAD; min-width: 80px;">Venue:</span>
                <span style="color: #333;">${eventData.eventVenue}</span>
              </div>
            </div>
          </div>
          ` : ''}

          <!-- Contact Info -->
          <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
            <p style="margin: 0; color: #6c757d; font-size: 14px;">
              Need help? Contact us at <a href="mailto:support@motojojo.co" style="color: #6A0DAD; text-decoration: none;">support@motojojo.co</a>
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #343a40; padding: 30px; text-align: center;">
          <p style="color: #ffffff; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">Motojojo Events</p>
          <p style="color: #adb5bd; margin: 0; font-size: 14px;">Creating unforgettable experiences</p>
          <div style="margin-top: 20px;">
            <a href="https://motojojo.co" style="color: #6A0DAD; text-decoration: none; font-size: 14px;">Visit our website</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};
