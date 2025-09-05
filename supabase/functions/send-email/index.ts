import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createTransport } from "npm:nodemailer"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Create Spacemail transporter with proper configuration
const transporter = createTransport({
  host: "mail.spacemail.com",
  port: 465, // Use port 465 for SSL
  secure: true, // Use SSL
  auth: {
    user: "community@motojojo.co",
    pass: "Iamajojo@123"
  },
  tls: {
    rejectUnauthorized: false // Allow self-signed certificates
  },
  debug: true, // Enable debug logging
  logger: true // Enable logger
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== SEND-EMAIL EDGE FUNCTION CALLED ===');
    
    const { 
      to, 
      subject, 
      html, 
      text, 
      attachments 
    } = await req.json()

    console.log('Request data:', { to, subject, hasHtml: !!html, hasText: !!text });

    if (!to || !subject) {
      console.error('Missing required fields:', { to, subject });
      return new Response(
        JSON.stringify({ error: 'Email and subject are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Send email using Spacemail
    const mailOptions = {
      from: '"Motojojo Events" <community@motojojo.co>',
      to: to,
      subject: subject,
      html: html,
      text: text,
      attachments: attachments || []
    };

    console.log('Attempting to send email with options:', { 
      from: mailOptions.from, 
      to: mailOptions.to, 
      subject: mailOptions.subject 
    });

    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent successfully:', info.messageId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: info.messageId,
        message: 'Email sent successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('=== ERROR SENDING EMAIL ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send email',
        details: error.message,
        type: error.constructor.name
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
