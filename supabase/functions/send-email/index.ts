import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createTransport } from "npm:nodemailer"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Create Spacemail transporter
const transporter = createTransport({
  host: "mail.spacemail.com",
  port: 465,
  secure: true, // SSL for port 465
  auth: {
    user: "community@motojojo.co",
    pass: "Iamajojo@123"
  }
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      to, 
      subject, 
      html, 
      text, 
      attachments 
    } = await req.json()

    if (!to || !subject) {
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
    console.error('Error sending email:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send email',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
