import express from 'express';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import puppeteer from 'puppeteer';
import QRCode from 'qrcode';

const app = express();
app.use(express.json());

const ses = new SESv2Client({
  region: 'ap-south-1',
  // credentials will be picked up from environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
});

// Generate PDF ticket HTML
const generateTicketHTML = (ticketData) => {
  const {
    eventTitle,
    eventDate,
    eventTime,
    eventVenue,
    ticketNumbers,
    qrCodes,
    ticketHolderNames,
    bookerName,
    bookerEmail
  } = ticketData;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Tickets - ${eventTitle}</title>
      <style>
        body {
          margin: 0;
          padding: 20px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #6A0DAD 0%, #8B5CF6 100%);
          min-height: 100vh;
        }
        .ticket-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #6A0DAD 0%, #8B5CF6 100%);
          color: white;
          padding: 40px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 32px;
          font-weight: 700;
        }
        .header p {
          margin: 10px 0 0 0;
          font-size: 18px;
          opacity: 0.9;
        }
        .content {
          padding: 40px;
        }
        .event-details {
          background: #f8f9fa;
          border-radius: 15px;
          padding: 30px;
          margin-bottom: 30px;
          border-left: 5px solid #6A0DAD;
        }
        .event-details h2 {
          margin: 0 0 20px 0;
          color: #333;
          font-size: 24px;
        }
        .detail-row {
          display: flex;
          margin-bottom: 15px;
          align-items: center;
        }
        .detail-label {
          font-weight: 600;
          color: #6A0DAD;
          min-width: 100px;
          margin-right: 20px;
        }
        .detail-value {
          color: #333;
          flex: 1;
        }
        .tickets-section {
          margin-top: 30px;
        }
        .tickets-section h2 {
          color: #333;
          margin-bottom: 20px;
          font-size: 24px;
        }
        .ticket-card {
          background: white;
          border: 2px solid #e9ecef;
          border-radius: 15px;
          padding: 25px;
          margin-bottom: 20px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.05);
          page-break-inside: avoid;
        }
        .ticket-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .ticket-info h3 {
          margin: 0;
          color: #333;
          font-size: 18px;
        }
        .ticket-number {
          color: #6c757d;
          font-family: monospace;
          font-size: 14px;
          margin: 5px 0;
        }
        .attendee-name {
          color: #6A0DAD;
          font-weight: 600;
          font-size: 14px;
        }
        .status-badge {
          background: #28a745;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }
        .qr-section {
          text-align: center;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 10px;
          margin-top: 15px;
        }
        .qr-code {
          width: 120px;
          height: 120px;
          border-radius: 10px;
          margin-bottom: 10px;
        }
        .qr-text {
          color: #6c757d;
          font-size: 12px;
          margin: 0;
        }
        .important-info {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 10px;
          padding: 20px;
          margin: 30px 0;
        }
        .important-info h3 {
          color: #856404;
          margin: 0 0 15px 0;
          font-size: 18px;
        }
        .important-info ul {
          margin: 0;
          padding-left: 20px;
          color: #856404;
        }
        .important-info li {
          margin-bottom: 8px;
        }
        .footer {
          background: #343a40;
          color: white;
          padding: 30px;
          text-align: center;
        }
        .footer h3 {
          margin: 0 0 10px 0;
          font-size: 20px;
        }
        .footer p {
          margin: 0;
          opacity: 0.8;
        }
        .footer a {
          color: #6A0DAD;
          text-decoration: none;
        }
        @media print {
          body { background: white; }
          .ticket-container { box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="ticket-container">
        <div class="header">
          <h1>🎫 Your Tickets Are Ready!</h1>
          <p>Thank you for booking with Motojojo Events</p>
        </div>
        
        <div class="content">
          <div class="event-details">
            <h2>📅 Event Details</h2>
            <div class="detail-row">
              <span class="detail-label">Event:</span>
              <span class="detail-value">${eventTitle}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span class="detail-value">${eventDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Time:</span>
              <span class="detail-value">${eventTime}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Venue:</span>
              <span class="detail-value">${eventVenue}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Booked by:</span>
              <span class="detail-value">${bookerName} (${bookerEmail})</span>
            </div>
          </div>

          <div class="tickets-section">
            <h2>🎟️ Your Tickets</h2>
            ${ticketNumbers.map((ticketNumber, index) => {
              const ticketHolderName = ticketHolderNames && ticketHolderNames[index] ? ticketHolderNames[index] : bookerName;
              return `
                <div class="ticket-card">
                  <div class="ticket-header">
                    <div class="ticket-info">
                      <h3>Ticket #${index + 1}</h3>
                      <p class="ticket-number">${ticketNumber}</p>
                      ${ticketHolderNames && ticketHolderNames[index] ? `<p class="attendee-name">Attendee: ${ticketHolderName}</p>` : ''}
                    </div>
                    <div class="status-badge">CONFIRMED</div>
                  </div>
                  <div class="qr-section">
                    <img src="${qrCodes[index]}" alt="QR Code for ${ticketNumber}" class="qr-code">
                    <p class="qr-text">Scan this QR code at the venue for entry</p>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <div class="important-info">
            <h3>⚠️ Important Information</h3>
            <ul>
              <li>Please arrive at least 30 minutes before the event starts</li>
              <li>Show your QR code at the entrance for entry</li>
              <li>Keep this ticket safe - you'll need it for entry</li>
              <li>Each QR code can only be used once</li>
              <li>This ticket is valid for the specified event only</li>
            </ul>
          </div>
        </div>
        
        <div class="footer">
          <h3>Motojojo Events</h3>
          <p>Creating unforgettable experiences</p>
          <p><a href="https://motojojo.co">Visit our website</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
};

app.post('/send-ticket', async (req, res) => {
  const { 
    email, 
    name, 
    eventTitle, 
    eventDate, 
    eventTime, 
    eventVenue,
    ticketNumbers,
    qrCodes,
    ticketHolderNames 
  } = req.body;

  try {
    // Generate ticket HTML
    const ticketHTML = generateTicketHTML({
      eventTitle,
      eventDate,
      eventTime,
      eventVenue,
      ticketNumbers,
      qrCodes,
      ticketHolderNames,
      bookerName: name,
      bookerEmail: email
    });

    // Generate PDF from HTML
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(ticketHTML, { waitUntil: 'networkidle0' });
    
    // Generate PDF with proper settings
    const pdfBuffer = await page.pdf({ 
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });
    await browser.close();

    // Send email with PDF attachment using AWS SES
    const emailParams = {
      from: 'Motojojo Events <info@motojojo.co>',
      to: [email],
      subject: `Your tickets for ${eventTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6A0DAD;">🎫 Your Tickets Are Ready!</h2>
          <p>Hello ${name},</p>
          <p>Your tickets for <strong>${eventTitle}</strong> have been successfully booked!</p>
          <p>Please find your tickets attached as a PDF file.</p>
          <p><strong>Event Details:</strong></p>
          <ul>
            <li><strong>Event:</strong> ${eventTitle}</li>
            <li><strong>Date:</strong> ${eventDate}</li>
            <li><strong>Time:</strong> ${eventTime}</li>
            <li><strong>Venue:</strong> ${eventVenue}</li>
          </ul>
          <p><strong>Important:</strong></p>
          <ul>
            <li>Please arrive at least 30 minutes before the event starts</li>
            <li>Show your QR code at the entrance for entry</li>
            <li>Keep this email and PDF ticket safe</li>
          </ul>
          <p>If you have any questions, please contact us at <a href="mailto:support@motojojo.co">support@motojojo.co</a></p>
          <p>Thank you for choosing Motojojo Events!</p>
        </div>
      `,
      attachments: [
        {
          filename: `tickets-${eventTitle.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    // Convert email params to AWS SES format
    const sesParams = {
      FromEmailAddress: 'info@motojojo.co',
      Destination: {
        ToAddresses: [email]
      },
      Content: {
        Simple: {
          Subject: {
            Data: `Your tickets for ${eventTitle}`,
            Charset: 'UTF-8'
          },
          Body: {
            Html: {
              Data: emailParams.html,
              Charset: 'UTF-8'
            }
          }
        }
      },
      Attachments: [
        {
          Filename: emailParams.attachments[0].filename,
          Content: pdfBuffer.toString('base64'),
          ContentType: 'application/pdf'
        }
      ]
    };

    await ses.send(new SendEmailCommand(sesParams));

    console.log(`Ticket email sent successfully to ${email} for event: ${eventTitle}`);
    res.status(200).json({ 
      success: true, 
      message: 'Ticket email sent successfully',
      recipient: email,
      event: eventTitle
    });
  } catch (error) {
    console.error('Error sending ticket email:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      recipient: email,
      event: eventTitle
    });
  }
});

// Bulk email endpoint
app.post('/send-bulk-email', async (req, res) => {
  const { 
    recipients,
    subject,
    html,
    text,
    template,
    eventData
  } = req.body;

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ 
      success: false, 
      error: 'Recipients array is required and cannot be empty' 
    });
  }

  if (!subject) {
    return res.status(400).json({ 
      success: false, 
      error: 'Subject is required' 
    });
  }

  try {
    const results = [];
    let totalSent = 0;
    let totalFailed = 0;

    // Process emails in batches to avoid overwhelming the email service
    const batchSize = 5;
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

          // Send email using AWS SES
          const sesParams = {
            FromEmailAddress: 'info@motojojo.co',
            Destination: {
              ToAddresses: [recipient.email]
            },
            Content: {
              Simple: {
                Subject: {
                  Data: subject,
                  Charset: 'UTF-8'
                },
                Body: {
                  Html: {
                    Data: personalizedHtml,
                    Charset: 'UTF-8'
                  },
                  Text: {
                    Data: personalizedText || personalizedHtml.replace(/<[^>]*>/g, ''),
                    Charset: 'UTF-8'
                  }
                }
              }
            }
          };

          await ses.send(new SendEmailCommand(sesParams));
          console.log(`Email sent successfully to ${recipient.email}`);
          return { email: recipient.email, success: true };
        } catch (error) {
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

    res.status(200).json({ 
      success: totalFailed === 0,
      totalSent,
      totalFailed,
      results,
      message: `Bulk email completed: ${totalSent} sent, ${totalFailed} failed`
    });

  } catch (error) {
    console.error('Error sending bulk email:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      message: "Failed to process bulk email request"
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'Email Service' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Email service running on port ${PORT}`);
  console.log('Ready to send ticket emails with PDF attachments via AWS SES');
}); 