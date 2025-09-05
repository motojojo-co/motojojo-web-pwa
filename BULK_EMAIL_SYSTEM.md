# Bulk Email System

This document explains the bulk email functionality that has been implemented to send emails to multiple recipients using the same email infrastructure as ticket bookings.

## Overview

The bulk email system allows administrators to send emails to multiple users simultaneously, using the same reliable email infrastructure that's used for ticket booking confirmations. The system supports both HTML and text emails with personalization features.

## Features

### ✅ Core Functionality
- **Bulk Email Sending**: Send emails to multiple recipients at once
- **Personalization**: Use `${name}` placeholder to personalize emails with recipient names
- **Batch Processing**: Emails are processed in batches to avoid rate limiting
- **Template Support**: Choose between announcement templates (with branding) or custom HTML
- **Event Filtering**: Filter recipients by specific events
- **Detailed Results**: See success/failure status for each recipient
- **Same Infrastructure**: Uses the same email service as ticket bookings

### ✅ Admin Interface
- **User Selection**: Select all users or filter by event attendees
- **Email Composition**: Rich text editor for email content
- **Template Selection**: Choose between branded announcement or custom HTML
- **Real-time Results**: See sending progress and detailed results
- **Error Handling**: Clear error messages and failed email details

## Technical Implementation

### 1. Bulk Email Service (`src/services/bulkEmailService.ts`)

The main service that handles bulk email operations:

```typescript
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
```

**Key Functions:**
- `sendBulkEmail()`: Main function to send bulk emails
- `getAllUsers()`: Fetch all users for bulk email
- `getUsersByEvent()`: Fetch users who booked specific events
- `createAnnouncementTemplate()`: Generate branded email templates

### 2. Supabase Edge Function (`supabase/functions/send-bulk-email/index.ts`)

Serverless function that handles the actual email sending:

- **Batch Processing**: Processes emails in batches of 5 to avoid rate limiting
- **Personalization**: Replaces `${name}` placeholders with actual recipient names
- **Error Handling**: Comprehensive error handling with detailed results
- **Rate Limiting**: 2-second delays between batches
- **Resend Integration**: Uses Resend email service for reliable delivery

### 3. Admin Interface (`src/components/admin/BulkEmailManager.tsx`)

React component for the admin interface:

- **Recipient Selection**: Checkbox interface to select users
- **Event Filtering**: Dropdown to filter by specific events
- **Email Composition**: Form for subject and content
- **Template Selection**: Choose between announcement and custom templates
- **Results Display**: Shows detailed sending results with success/failure status

### 4. Email Service Integration (`emailService.js`)

Extended the existing email service with bulk email endpoint:

- **AWS SES Integration**: Uses the same AWS SES service as ticket emails
- **Batch Processing**: Handles large recipient lists efficiently
- **Personalization**: Supports name replacement in email content
- **Error Tracking**: Detailed error reporting for each recipient

## Usage Guide

### For Administrators

1. **Access Bulk Email**:
   - Go to Admin Dashboard
   - Click on "Bulk Email" tab

2. **Select Recipients**:
   - Choose "All Users" or filter by specific event
   - Use checkboxes to select individual recipients
   - Use "Select All" to select all visible users

3. **Compose Email**:
   - Enter email subject
   - Choose template type:
     - **Announcement**: Professional template with Motojojo branding
     - **Custom**: Raw HTML content
   - Write your email content
   - Use `${name}` to personalize with recipient names

4. **Send Email**:
   - Click "Send" button
   - Monitor progress in real-time
   - Review detailed results showing success/failure for each recipient

### Email Templates

#### Announcement Template
The announcement template includes:
- Motojojo branding and colors
- Professional layout with header and footer
- Event details section (if applicable)
- Contact information
- Responsive design

#### Custom HTML Template
For advanced users who want full control over email design.

### Personalization

Use the `${name}` placeholder in your email content to personalize messages:

```html
<p>Hello ${name},</p>
<p>We're excited to invite you to our upcoming event...</p>
```

This will be replaced with each recipient's actual name.

## Email Infrastructure

The bulk email system uses the same reliable infrastructure as ticket bookings:

### Primary: Resend Email Service
- Used by Supabase edge functions
- High deliverability rates
- Professional email templates
- Built-in analytics

### Fallback: AWS SES
- Used by the Node.js email service
- Enterprise-grade reliability
- PDF attachment support
- Detailed logging

### Email Templates
Both services use consistent branding:
- Motojojo purple gradient headers
- Professional typography
- Responsive design
- Contact information
- Brand consistency

## Rate Limiting & Performance

### Batch Processing
- Emails are processed in batches of 5 recipients
- 2-second delays between batches to avoid rate limiting
- Prevents overwhelming email services

### Error Handling
- Individual email failures don't stop the entire batch
- Detailed error reporting for each recipient
- Graceful degradation for service issues

### Performance Monitoring
- Real-time progress updates
- Success/failure counts
- Detailed result breakdowns

## Security & Compliance

### Data Protection
- Email addresses are only used for sending emails
- No personal data is stored beyond what's necessary
- Secure transmission via HTTPS

### Spam Prevention
- Professional email templates
- Clear unsubscribe mechanisms
- Respect for recipient preferences
- Rate limiting to prevent abuse

## Testing

### Test Script
A test script is provided (`test-bulk-email.js`) that demonstrates:
- How to structure bulk email requests
- Example recipients and content
- Usage instructions

### Manual Testing
1. Use the admin interface to send test emails
2. Start with small recipient lists
3. Verify email delivery and formatting
4. Check personalization works correctly

## Troubleshooting

### Common Issues

1. **Emails Not Sending**:
   - Check email service configuration
   - Verify recipient email addresses
   - Check for rate limiting issues

2. **Personalization Not Working**:
   - Ensure `${name}` placeholder is used correctly
   - Verify recipient names are available
   - Check template selection

3. **Template Issues**:
   - Verify HTML is valid
   - Check for missing closing tags
   - Test with simple content first

### Error Messages
The system provides detailed error messages for:
- Invalid recipient lists
- Missing required fields
- Email service failures
- Individual recipient errors

## Future Enhancements

### Planned Features
- **Email Scheduling**: Send emails at specific times
- **A/B Testing**: Test different email versions
- **Analytics**: Track open rates and engagement
- **Segmentation**: Advanced user filtering options
- **Templates Library**: Pre-built email templates
- **Unsubscribe Management**: Handle unsubscribe requests

### Integration Opportunities
- **Event Notifications**: Automatic emails for event updates
- **Marketing Campaigns**: Promotional email campaigns
- **User Onboarding**: Welcome email sequences
- **Feedback Collection**: Post-event survey emails

## Support

For technical support or questions about the bulk email system:
- Check the admin interface for error messages
- Review the console logs for detailed error information
- Contact the development team for advanced troubleshooting

---

**Note**: This bulk email system is designed to be reliable, scalable, and user-friendly while maintaining the same high standards as the existing ticket booking email system.


