import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Users, CheckCircle, XCircle, AlertCircle, ArrowLeft, Upload, FileText, Calendar } from 'lucide-react';
import { sendBulkEmail, getAllUsersForBulkEmail, getUsersByEvent, createAnnouncementTemplate, BulkEmailRequest } from '@/services/bulkEmailService';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { FadeIn } from '@/components/ui/motion';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  city: string;
}

const BulkEmailPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [emailForm, setEmailForm] = useState({
    subject: '',
    content: '',
    template: 'announcement' as 'announcement' | 'custom'
  });
  const [emailResults, setEmailResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [recipientSource, setRecipientSource] = useState<'all' | 'event' | 'csv'>('all');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvRecipients, setCsvRecipients] = useState<Array<{email: string, name?: string}>>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const { toast } = useToast();

  console.log('BulkEmailPage component rendered');
  console.log('Current URL:', window.location.href);

  useEffect(() => {
    console.log('BulkEmailPage useEffect triggered');
    loadUsers();
    loadEvents();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading users for bulk email...');
      const userData = await getAllUsersForBulkEmail();
      console.log('Users loaded:', userData.length, 'users');
      setUsers(userData);
    } catch (error: any) {
      console.error('Error loading users:', error);
      setError(error.message || 'Failed to load users');
      toast({
        title: "Error",
        description: `Failed to load users: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      // Load events from the database
      const { data, error } = await supabase
        .from('events')
        .select('id, title, date, time, venue, city')
        .order('date', { ascending: false });
      
      if (error) {
        console.error('Error loading events:', error);
        return;
      }
      
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const handleCsvFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setCsvError('Please upload a CSV file');
      return;
    }

    setCsvFile(file);
    setCsvError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const lines = csvText.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          setCsvError('CSV file must have at least a header row and one data row');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const emailIndex = headers.findIndex(h => h.includes('email'));
        const nameIndex = headers.findIndex(h => h.includes('name') || h.includes('full_name'));

        if (emailIndex === -1) {
          setCsvError('CSV file must contain an "email" column');
          return;
        }

        const recipients: Array<{email: string, name?: string}> = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const email = values[emailIndex];
          const name = nameIndex !== -1 ? values[nameIndex] : undefined;
          
          if (email && email.includes('@')) {
            recipients.push({ email, name });
          }
        }

        if (recipients.length === 0) {
          setCsvError('No valid email addresses found in CSV file');
          return;
        }

        setCsvRecipients(recipients);
        toast({
          title: "CSV Uploaded Successfully",
          description: `Found ${recipients.length} valid email addresses`,
        });
      } catch (error) {
        setCsvError('Error parsing CSV file');
        console.error('CSV parsing error:', error);
      }
    };

    reader.readAsText(file);
  };

  const handleUserSelection = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(users.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleEventSelection = async (eventId: string) => {
    setSelectedEvent(eventId);
    if (eventId && eventId !== 'all') {
      try {
        setLoading(true);
        const eventUsers = await getUsersByEvent(eventId);
        setUsers(eventUsers.map(booking => ({
          id: booking.id,
          email: booking.email,
          name: booking.name,
          created_at: booking.booking_date
        })));
        setSelectedUsers([]);
      } catch (error) {
        console.error('Error loading event users:', error);
        toast({
          title: "Error",
          description: "Failed to load event users",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    } else {
      loadUsers();
    }
  };

  const handleSendBulkEmail = async () => {
    if (!emailForm.subject || !emailForm.content) {
      toast({
        title: "Error",
        description: "Please fill in subject and content",
        variant: "destructive",
      });
      return;
    }

    let recipients: Array<{email: string, name?: string}> = [];

    // Get recipients based on selected source
    if (recipientSource === 'csv') {
      if (csvRecipients.length === 0) {
        toast({
          title: "Error",
          description: "Please upload a CSV file with recipients",
          variant: "destructive",
        });
        return;
      }
      recipients = csvRecipients;
    } else if (recipientSource === 'event') {
      if (selectedEvent === 'all' || !selectedEvent) {
        toast({
          title: "Error",
          description: "Please select a specific event",
          variant: "destructive",
        });
        return;
      }
      // For event-based, we'll use all users from that event
      const selectedUserData = users.filter(user => selectedUsers.includes(user.id));
      recipients = selectedUserData.map(user => ({
        email: user.email,
        name: user.name
      }));
    } else {
      // All users
      if (selectedUsers.length === 0) {
        toast({
          title: "Error",
          description: "Please select at least one recipient",
          variant: "destructive",
        });
        return;
      }
      const selectedUserData = users.filter(user => selectedUsers.includes(user.id));
      recipients = selectedUserData.map(user => ({
        email: user.email,
        name: user.name
      }));
    }

    if (recipients.length === 0) {
      toast({
        title: "Error",
        description: "No recipients selected",
        variant: "destructive",
      });
      return;
    }

    try {
      setSending(true);
      setEmailResults(null);

      let htmlContent = emailForm.content;
      
      if (emailForm.template === 'announcement') {
        const eventData = selectedEvent && selectedEvent !== 'all' ? events.find(e => e.id === selectedEvent) : undefined;
        htmlContent = createAnnouncementTemplate(
          emailForm.subject,
          emailForm.content,
          eventData ? {
            eventTitle: eventData.title,
            eventDate: eventData.date,
            eventTime: eventData.time,
            eventVenue: `${eventData.venue}, ${eventData.city}`
          } : undefined
        );
      }

      const bulkEmailRequest: BulkEmailRequest = {
        recipients,
        subject: emailForm.subject,
        html: htmlContent,
        template: emailForm.template
      };

      const result = await sendBulkEmail(bulkEmailRequest);
      setEmailResults(result);

      toast({
        title: "Bulk Email Sent",
        description: `Successfully sent ${result.totalSent} emails, ${result.totalFailed} failed`,
      });

    } catch (error: any) {
      console.error('Error sending bulk email:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send bulk email",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <FadeIn>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/admin/dashboard')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Bulk Email Manager</h1>
                <p className="text-gray-600 mt-2">Send emails to multiple recipients using the same system as ticket bookings</p>
              </div>
              <Badge variant="outline" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {recipientSource === 'csv' ? csvRecipients.length : selectedUsers.length} selected
              </Badge>
            </div>
          </div>

          {/* Debug info */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Debug Info:</strong> Component loaded. Users: {users.length}, Loading: {loading.toString()}, Error: {error || 'None'}
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recipients Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Select Recipients
                </CardTitle>
                <CardDescription>
                  Choose who will receive the bulk email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Recipient Source Selection */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Recipient Source</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={recipientSource === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setRecipientSource('all')}
                      className="flex items-center gap-2"
                    >
                      <Users className="h-4 w-4" />
                      All Users
                    </Button>
                    <Button
                      variant={recipientSource === 'event' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setRecipientSource('event')}
                      className="flex items-center gap-2"
                    >
                      <Calendar className="h-4 w-4" />
                      Event Based
                    </Button>
                    <Button
                      variant={recipientSource === 'csv' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setRecipientSource('csv')}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      CSV Upload
                    </Button>
                  </div>
                </div>

                {/* Event Selection (for event-based) */}
                {recipientSource === 'event' && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Select Event</Label>
                    <Select value={selectedEvent} onValueChange={handleEventSelection}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an event" />
                      </SelectTrigger>
                      <SelectContent>
                        {events.map(event => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.title} - {event.date}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* CSV Upload (for CSV-based) */}
                {recipientSource === 'csv' && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Upload CSV File</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleCsvFileUpload}
                        className="hidden"
                        id="csv-upload"
                      />
                      <label htmlFor="csv-upload" className="cursor-pointer">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600 mb-1">
                          Click to upload CSV file
                        </p>
                        <p className="text-xs text-gray-500">
                          CSV should have columns: email, name (optional)
                        </p>
                        <a 
                          href="/sample-recipients.csv" 
                          download="sample-recipients.csv"
                          className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                        >
                          Download sample CSV
                        </a>
                      </label>
                    </div>
                    {csvFile && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                        <p className="text-sm text-green-800 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {csvFile.name} - {csvRecipients.length} recipients loaded
                        </p>
                      </div>
                    )}
                    {csvError && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{csvError}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                {/* User Selection (for all users and event-based) */}
                {recipientSource !== 'csv' && (
                  <>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="select-all"
                        checked={selectedUsers.length === users.length && users.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                      <Label htmlFor="select-all">Select All ({users.length} users)</Label>
                    </div>

                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {loading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : (
                        users.map(user => (
                          <div key={user.id} className="flex items-center space-x-2 p-2 border rounded">
                            <Checkbox
                              id={user.id}
                              checked={selectedUsers.includes(user.id)}
                              onCheckedChange={(checked) => handleUserSelection(user.id, checked as boolean)}
                            />
                            <div className="flex-1">
                              <Label htmlFor={user.id} className="font-medium">
                                {user.name || 'No name'}
                              </Label>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Email Composition */}
            <Card>
              <CardHeader>
                <CardTitle>Compose Email</CardTitle>
                <CardDescription>
                  Create your bulk email message
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="template">Template</Label>
                  <Select value={emailForm.template} onValueChange={(value: 'announcement' | 'custom') => 
                    setEmailForm({...emailForm, template: value})
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="announcement">Announcement (with branding)</SelectItem>
                      <SelectItem value="custom">Custom HTML</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})}
                    placeholder="Enter email subject"
                  />
                </div>

                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={emailForm.content}
                    onChange={(e) => setEmailForm({...emailForm, content: e.target.value})}
                    placeholder={emailForm.template === 'announcement' 
                      ? "Enter your message content. Use ${name} to personalize with recipient's name."
                      : "Enter your HTML content"
                    }
                    rows={8}
                  />
                </div>

                <Button 
                  onClick={handleSendBulkEmail} 
                  disabled={sending || (recipientSource === 'csv' ? csvRecipients.length === 0 : selectedUsers.length === 0)}
                  className="w-full"
                >
                  {sending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send to {recipientSource === 'csv' ? csvRecipients.length : selectedUsers.length} recipients
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          {emailResults && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {emailResults.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  )}
                  Email Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{emailResults.totalSent}</div>
                    <div className="text-sm text-muted-foreground">Sent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{emailResults.totalFailed}</div>
                    <div className="text-sm text-muted-foreground">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{emailResults.results.length}</div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                </div>

                {emailResults.totalFailed > 0 && (
                  <Alert>
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      Some emails failed to send. Check the results below for details.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {emailResults.results.map((result: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{result.email}</span>
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="text-xs text-red-500">{result.error}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </FadeIn>
    </div>
  );
};

export default BulkEmailPage;
