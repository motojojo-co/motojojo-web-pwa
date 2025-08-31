import { supabase } from "@/integrations/supabase/client";

export interface EmailRequest {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
}

export const sendEmail = async (request: EmailRequest) => {
  try {
    console.log('=== SENDING EMAIL VIA SPACEMAIL ===');
    console.log('Request:', JSON.stringify(request, null, 2));
    
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: request
    });

    console.log('Supabase response:', { data, error });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(error.message || 'Failed to send email');
    }

    console.log('Email sent successfully:', data);
    return data;
  } catch (error: any) {
    console.error('Error sending email:', error);
    throw error;
  }
};
