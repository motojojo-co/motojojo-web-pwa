import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

// Resend instance uses the secret key from Supabase environment variable
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BulkEmailRequest {
  recipients: Array<{
    email: string;
    name?: string;
    customData?: Record<string, any>;
  }>;
  subject: string;
  html?: string;
  text?: string;
  template?: 'announcement' | 'custom';
  eventData?: {
    eventTitle: string;
    eventDate: string;
    eventTime: string;
    eventVenue: string;
  };
}

interface BulkEmailResponse {
  success: boolean;
  totalSent: number;
  totalFailed: number;
  results: Array<{
    email: string;
    success: boolean;
    error?: string;
  }>;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      recipients,
      subject,
      html,
      text,
      template,
      eventData
    }: BulkEmailRequest = await req.json();

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Recipients array is required and cannot be empty' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!subject) {
      return new Response(
        JSON.stringify({ error: 'Subject is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const results: Array<{ email: string; success: boolean; error?: string }> = [];
    let totalSent = 0;
    let totalFailed = 0;

    // Process emails in batches to avoid overwhelming the email service
    const batchSize = 5; // Smaller batch size for bulk operations
    const batches = [];
    
    for (let i = 0; i < recipients.length; i += batchSize) {
      batches.push(recipients.slice(i, i + batchSize));
    }

    console.log(`Processing ${recipients.length} recipients in ${batches.length} batches`);

    for (const batch of batches) {
      const batchPromises = batch.map(async (recipient) => {
        try {
          // Personalize the email content if name is provided
          let personalizedHtml = html;
          let personalizedText = text;
          
          if (recipient.name && html) {
            personalizedHtml = html.replace(/\$\{name\}/g, recipient.name);
          }
          if (recipient.name && text) {
            personalizedText = text.replace(/\$\{name\}/g, recipient.name);
          }

          // Send email via Resend
          const emailResponse = await resend.emails.send({
            from: "Motojojo Events <info@motojojo.co>",
            to: [recipient.email],
            subject: subject,
            html: personalizedHtml,
            text: personalizedText,
          });

          console.log(`Email sent successfully to ${recipient.email}:`, emailResponse.id);
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

      // Add a delay between batches to avoid rate limiting
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      }
    }

    console.log(`Bulk email completed: ${totalSent} sent, ${totalFailed} failed`);

    return new Response(JSON.stringify({
      success: totalFailed === 0,
      totalSent,
      totalFailed,
      results,
      message: `Bulk email completed: ${totalSent} sent, ${totalFailed} failed`
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error("Error in bulk email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        message: "Failed to process bulk email request"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);


