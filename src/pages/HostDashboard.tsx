import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FadeIn } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  LogOut, 
  Plus, 
  Search, 
  Filter, 
  Users, 
  Calendar, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  RefreshCw,
  QrCode,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  Check,
  X
} from "lucide-react";
import { 
  getHostProfile,
  getHostEvents,
  getEventTickets,
  searchTicketByNumber,
  markAttendance,
  getAttendanceStats,
  getAttendanceSummary,
  getHostDashboardData,
  subscribeToAttendanceRecords
} from "@/services/hostService";
import {
  getHostSpaces,
  getEventsAtHostSpaces,
  getHostEventRequests,
  HostSpace,
  HostEventRequest,
} from "@/services/hostSpaceService";
import HostSpaceForm from "@/components/host/HostSpaceForm";
import EventRequestForm from "@/components/host/EventRequestForm";
import { Event } from "@/services/eventService";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ProtectedRoute from "@/components/ProtectedRoute";
import EventForm from "@/components/admin/EventForm";
import { createEvent } from "@/services/adminEventService";
import { supabase } from "@/integrations/supabase/client";

const HostDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { signOut, isHost } = useAuth();

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTab, setCurrentTab] = useState('overview');
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState<'present' | 'absent'>('present');
  const [attendanceNotes, setAttendanceNotes] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [isSpaceFormOpen, setIsSpaceFormOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<HostSpace | null>(null);
  const [isEventRequestFormOpen, setIsEventRequestFormOpen] = useState(false);
  const hostTabs = [
    { value: "overview", label: "Overview", icon: TrendingUp },
    { value: "attendance", label: "Mark Attendance", icon: QrCode },
    { value: "events", label: "My Experiences", icon: Calendar },
    { value: "spaces", label: "My Spaces", icon: MapPin },
    { value: "calendar", label: "Calendar", icon: Calendar },
    { value: "requests", label: "Event Requests", icon: Clock },
    { value: "reports", label: "Reports", icon: TrendingUp },
  ];

  // Fetch host profile
  const { data: hostProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['host-profile'],
    queryFn: getHostProfile,
    enabled: isHost
  });

  // Fetch host events
  const { data: hostEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['host-events'],
    queryFn: getHostEvents,
    enabled: isHost
  });

  // Fetch host dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['host-dashboard-data'],
    queryFn: getHostDashboardData,
    enabled: isHost
  });

  // Fetch attendance summary
  const { data: attendanceSummary = [], isLoading: summaryLoading } = useQuery({
    queryKey: ['host-attendance-summary'],
    queryFn: getAttendanceSummary,
    enabled: isHost
  });

  // Fetch host spaces
  const { data: hostSpaces = [], isLoading: spacesLoading } = useQuery({
    queryKey: ['host-spaces'],
    queryFn: getHostSpaces,
    enabled: isHost
  });

  // Fetch event requests
  const { data: eventRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['host-event-requests'],
    queryFn: getHostEventRequests,
    enabled: isHost
  });

  // Fetch event tickets when event is selected
  const { data: eventTickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ['event-tickets', selectedEvent?.id],
    queryFn: () => selectedEvent ? getEventTickets(selectedEvent.id) : Promise.resolve([]),
    enabled: !!selectedEvent
  });

  // Subscribe to real-time attendance updates
  useEffect(() => {
    if (!isHost) return;

    const unsubscribe = subscribeToAttendanceRecords((payload) => {
      queryClient.invalidateQueries({ queryKey: ['host-attendance-summary'] });
      queryClient.invalidateQueries({ queryKey: ['host-dashboard-data'] });
      if (selectedEvent) {
        queryClient.invalidateQueries({ queryKey: ['event-tickets', selectedEvent.id] });
      }
      toast({
        title: "Attendance Updated",
        description: "Attendance records have been updated.",
      });
    });

    // Subscribe to events table changes for real-time updates
    const eventsSubscription = supabase
      .channel('host-events-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'events' }, 
        (payload) => {
          console.log('Event change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['host-events'] });
          queryClient.invalidateQueries({ queryKey: ['host-dashboard-data'] });
          queryClient.invalidateQueries({ queryKey: ['host-attendance-summary'] });
          toast({
            title: "Events Updated",
            description: "The events list has been updated.",
          });
        }
      )
      .subscribe();

    return () => {
      unsubscribe();
      supabase.removeChannel(eventsSubscription);
    };
  }, [isHost, queryClient, toast, selectedEvent]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const stopScanner = () => {
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const startScanner = async () => {
    try {
      setScanError(null);
      const BarcodeDetectorCtor = (window as any).BarcodeDetector;
      if (!BarcodeDetectorCtor) {
        setScanError("Camera scanning is not supported in this browser. Please use manual entry.");
        return;
      }
      if (!videoRef.current) return;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      const detector = new BarcodeDetectorCtor({ formats: ["qr_code"] });
      setIsScanning(true);

      scanIntervalRef.current = window.setInterval(async () => {
        try {
          if (!videoRef.current) return;
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const rawValue = barcodes[0]?.rawValue?.trim();
            if (rawValue) {
              setTicketNumber(rawValue);
              setAttendanceStatus('present');
              setAttendanceNotes('');
              stopScanner();
              await handleMarkAttendance();
            }
          }
        } catch (error) {
          // ignore transient detection errors
        }
      }, 500);
    } catch (error: any) {
      setScanError(error?.message || "Unable to access camera. Please check permissions.");
      stopScanner();
    }
  };

  useEffect(() => {
    if (!isAttendanceDialogOpen) {
      setIsScannerOpen(false);
    }
  }, [isAttendanceDialogOpen]);

  useEffect(() => {
    if (isScannerOpen) {
      startScanner();
    } else {
      stopScanner();
    }
    return () => stopScanner();
  }, [isScannerOpen]);

  const handleMarkAttendance = async () => {
    if (!selectedEvent || !ticketNumber.trim()) {
      toast({
        title: "Error",
        description: "Please select an event and enter a ticket number.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // First search for the ticket
      const ticket = await searchTicketByNumber(ticketNumber.trim(), selectedEvent.id);
      if (!ticket) {
        toast({
          title: "Ticket Not Found",
          description: "No ticket found with this number for the selected event.",
          variant: "destructive"
        });
        return;
      }

      // Mark attendance
      const result = await markAttendance(
        ticket.id,
        selectedEvent.id,
        attendanceStatus,
        attendanceNotes
      );

      if (result.success) {
        toast({
          title: "Success",
          description: `Attendance marked as ${attendanceStatus}`,
        });
        setIsAttendanceDialogOpen(false);
        setTicketNumber('');
        setAttendanceNotes('');
        // Refresh data
        queryClient.invalidateQueries({ queryKey: ['host-attendance-summary'] });
        queryClient.invalidateQueries({ queryKey: ['host-dashboard-data'] });
        queryClient.invalidateQueries({ queryKey: ['event-tickets', selectedEvent.id] });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to mark attendance",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isHost) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You need to be a host to access this dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/host/login")} className="w-full">
              Go to Host Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 relative isolate">
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <div className="flex min-h-screen">
          <aside className="hidden lg:flex w-72 flex-col border-r border-slate-200 bg-white sticky top-0 h-screen">
            <div className="px-7 py-6 border-b border-slate-200">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Motojojo
              </div>
              <div className="text-lg font-semibold text-slate-900">Host Console</div>
            </div>
            <div className="px-5 py-6 overflow-y-auto">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500 px-2 mb-4">
                Navigation
              </div>
              <TabsList className="flex h-auto w-full flex-col items-stretch justify-start gap-2 bg-transparent p-0">
                {hostTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="justify-start gap-3 rounded-xl px-4 py-2.5 text-left text-sm data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>
          </aside>

          <div className="flex-1 min-w-0 relative z-50 pointer-events-auto">
            <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur pointer-events-auto">
              <div className="container-padding py-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-4">
                    <Calendar className="h-8 w-8 text-violet" />
                    <div>
                      <h1 className="text-2xl font-semibold text-slate-900">Host Dashboard</h1>
                      <p className="text-sm text-slate-600">
                        Welcome back, {hostProfile?.host_name || 'Host'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => navigate("/")}>
                      Back to Site
                    </Button>
                    <Button variant="outline" onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </div>
            </header>

            <main className="py-8 pb-20 md:pb-8 relative z-50 pointer-events-auto">
              <div className="container-padding max-w-7xl mx-auto">
                <FadeIn>
                  <div className="lg:hidden mb-6">
                    <TabsList className="grid h-auto w-full grid-cols-2 gap-3 sm:grid-cols-3 bg-transparent p-0">
                      {hostTabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                          <TabsTrigger
                            key={tab.value}
                            value={tab.value}
                            className="justify-start gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-left text-sm data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 text-slate-600"
                          >
                            <Icon className="h-4 w-4" />
                            <span className="truncate">{tab.label}</span>
                          </TabsTrigger>
                        );
                      })}
                    </TabsList>
                  </div>

                  {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border border-slate-200 bg-white shadow-sm rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-violet">Total Experiences</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-violet">
                  {dashboardLoading ? <Skeleton className="h-8 w-16" /> : dashboardData?.total_events || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 bg-white shadow-sm rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-violet">Total Tickets</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-violet">
                  {dashboardLoading ? <Skeleton className="h-8 w-16" /> : dashboardData?.total_tickets || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 bg-white shadow-sm rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-violet">Present</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {dashboardLoading ? <Skeleton className="h-8 w-16" /> : dashboardData?.present_tickets || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 bg-white shadow-sm rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-violet">Absent</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {dashboardLoading ? <Skeleton className="h-8 w-16" /> : dashboardData?.absent_tickets || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <Card className="border border-slate-200 bg-white shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle>Recent Attendance Summary</CardTitle>
                  <CardDescription>
                    Overview of attendance for your recent experiences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {summaryLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {attendanceSummary.slice(0, 5).map((event) => (
                        <div key={event.event_id} className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 text-slate-800">
                          <div>
                            <h3 className="font-semibold">{event.event_title}</h3>
                            <p className="text-sm text-gray-600">
                              {formatDate(event.event_date || '')} • {event.event_city}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-4">
                              <div>
                                <p className="text-sm text-gray-600">Present</p>
                                <p className="font-semibold text-green-600">{event.present_count || 0}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Absent</p>
                                <p className="font-semibold text-red-600">{event.absent_count || 0}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Rate</p>
                                <p className="font-semibold">{event.attendance_rate || 0}%</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Mark Attendance Tab */}
            <TabsContent value="attendance" className="space-y-6">
              <Card className="border border-slate-200 bg-white shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle>Mark Attendance</CardTitle>
                  <CardDescription>
                    Mark attendees as present or absent for your experiences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Event Selection */}
                  <div className="space-y-2">
                    <Label>Select Experience</Label>
                    <Select onValueChange={(value) => {
                      const event = hostEvents.find(e => e.id === value);
                      setSelectedEvent(event || null);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an experience" />
                      </SelectTrigger>
                      <SelectContent>
                        {hostEvents.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.title} - {formatDate(event.date)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quick Attendance Marking */}
                  <Dialog open={isAttendanceDialogOpen} onOpenChange={setIsAttendanceDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <QrCode className="h-4 w-4 mr-2" />
                        Mark Attendance
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Mark Attendance</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-slate-700">Scan QR with Camera</div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setIsScannerOpen((prev) => !prev)}
                            >
                              <QrCode className="h-4 w-4 mr-2" />
                              {isScannerOpen ? "Stop Scanner" : "Start Scanner"}
                            </Button>
                          </div>
                          {isScannerOpen && (
                            <div className="space-y-3">
                              <div className="relative overflow-hidden rounded-lg bg-black">
                                <video
                                  ref={videoRef}
                                  className="w-full h-52 object-cover"
                                  playsInline
                                  muted
                                />
                                <div className="pointer-events-none absolute inset-0 border-2 border-white/40 rounded-lg" />
                                {isScanning && (
                                  <div className="absolute bottom-2 left-2 text-xs text-white bg-black/60 px-2 py-1 rounded">
                                    Scanning...
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-slate-600">
                                Align the ticket QR inside the frame. Attendance will be marked automatically.
                              </div>
                            </div>
                          )}
                          {scanError && (
                            <div className="text-xs text-red-600">{scanError}</div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>Ticket Number</Label>
                          <Input
                            placeholder="Enter ticket number"
                            value={ticketNumber}
                            onChange={(e) => setTicketNumber(e.target.value)}
                            className="bg-yellow/10 text-violet"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select value={attendanceStatus} onValueChange={(value: 'present' | 'absent') => setAttendanceStatus(value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="present">Present</SelectItem>
                              <SelectItem value="absent">Absent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Notes (Optional)</Label>
                          <Textarea
                            placeholder="Add any notes..."
                            value={attendanceNotes}
                            onChange={(e) => setAttendanceNotes(e.target.value)}
                            className="bg-yellow/10 text-violet"
                          />
                        </div>
                        <Button onClick={handleMarkAttendance} disabled={loading} className="w-full">
                          {loading ? "Marking..." : "Mark Attendance"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Event Tickets Table */}
                  {selectedEvent && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-violet">Tickets for {selectedEvent.title}</h3>
                        <div className="flex items-center space-x-2">
                          <Input
                            placeholder="Search tickets..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-64 bg-yellow/10 text-violet"
                          />
                          <Search className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                      
                      {ticketsLoading ? (
                        <div className="space-y-2">
                          {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                          ))}
                        </div>
                      ) : (
                        <Table className="bg-slate-50 text-slate-800">
                          <TableHeader>
                            <TableRow>
                              <TableHead>Ticket #</TableHead>
                              <TableHead>Attendee</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Phone</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {eventTickets
                              .filter(ticket => 
                                ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                ticket.bookings?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                ticket.bookings?.email.toLowerCase().includes(searchTerm.toLowerCase())
                              )
                              .map((ticket) => (
                                <TableRow key={ticket.id}>
                                  <TableCell className="font-mono">{ticket.ticket_number}</TableCell>
                                  <TableCell>{ticket.bookings?.name}</TableCell>
                                  <TableCell>{ticket.bookings?.email}</TableCell>
                                  <TableCell>{ticket.bookings?.phone}</TableCell>
                                  <TableCell>
                                    {ticket.attended === true ? (
                                      <span className="flex items-center text-green-600">
                                        <Check className="h-4 w-4 mr-1" />
                                        Present
                                      </span>
                                    ) : ticket.attended === false ? (
                                      <span className="flex items-center text-red-600">
                                        <X className="h-4 w-4 mr-1" />
                                        Absent
                                      </span>
                                    ) : (
                                      <span className="text-gray-500">Not marked</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex space-x-2">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => {
                                                setTicketNumber(ticket.ticket_number);
                                                setAttendanceStatus('present');
                                                setAttendanceNotes('');
                                                setIsAttendanceDialogOpen(true);
                                              }}
                                            >
                                              <Check className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Mark as Present</TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => {
                                                setTicketNumber(ticket.ticket_number);
                                                setAttendanceStatus('absent');
                                                setAttendanceNotes('');
                                                setIsAttendanceDialogOpen(true);
                                              }}
                                            >
                                              <X className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Mark as Absent</TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Events Tab */}
            <TabsContent value="events" className="space-y-6">
              <Card className="border border-slate-200 bg-white shadow-sm rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>My Experiences</CardTitle>
                    <CardDescription>
                      Experiences you are hosting or managing
                    </CardDescription>
                  </div>
                  <Button onClick={() => setIsCreateEventOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Experience
                  </Button>
                </CardHeader>
                <CardContent>
                  {eventsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {hostEvents.map((event) => (
                        <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 text-slate-800">
                          <div className="flex items-center space-x-4">
                            <div>
                              <h3 className="font-semibold">{event.title}</h3>
                              <p className="text-sm text-gray-600">
                                {formatDate(event.date)} • {formatTime(event.time)} • {event.venue}
                              </p>
                              <p className="text-sm text-gray-500">{event.city}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedEvent(event as Event);
                                setCurrentTab('attendance');
                              }}
                            >
                              Manage Attendance
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Experience</DialogTitle>
                  </DialogHeader>
                  <EventForm
                    onSubmit={async (data) => {
                      if (!hostProfile) return;
                      await createEvent({ ...data, host: hostProfile.id });
                      setIsCreateEventOpen(false);
                      queryClient.invalidateQueries({ queryKey: ['host-events'] });
                    }}
                  />
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* Spaces Tab */}
            <TabsContent value="spaces" className="space-y-6">
              <Card className="border border-slate-200 bg-white shadow-sm rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>My Spaces</CardTitle>
                    <CardDescription>
                      Manage your spaces where events can be hosted
                    </CardDescription>
                  </div>
                  <Button onClick={() => {
                    setEditingSpace(null);
                    setIsSpaceFormOpen(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Space
                  </Button>
                </CardHeader>
                <CardContent>
                  {spacesLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                      ))}
                    </div>
                  ) : hostSpaces.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No spaces added yet. Click "Add Space" to get started.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {hostSpaces.map((space) => (
                        <div key={space.id} className="border rounded-lg p-4 bg-slate-50">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-violet">{space.name}</h3>
                              <p className="text-sm text-gray-600">{space.location}, {space.city}</p>
                            </div>
                            <Badge 
                              variant={
                                space.status === 'approved' ? 'default' : 
                                space.status === 'pending' ? 'secondary' : 
                                'destructive'
                              }
                            >
                              {space.status}
                            </Badge>
                          </div>
                          {space.images && space.images.length > 0 && (
                            <img
                              src={space.images[0]}
                              alt={space.name}
                              className="w-full h-32 object-cover rounded mb-2"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/placeholder.svg";
                              }}
                            />
                          )}
                          <p className="text-sm text-gray-600 mb-2">{space.address}</p>
                          {space.description && (
                            <p className="text-sm text-gray-500 mb-2 line-clamp-2">{space.description}</p>
                          )}
                          {space.capacity && (
                            <p className="text-sm text-violet">Capacity: {space.capacity}</p>
                          )}
                          <div className="flex gap-2 mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingSpace(space);
                                setIsSpaceFormOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                            {space.status === 'approved' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setIsEventRequestFormOpen(true);
                                }}
                              >
                                Request Event
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              {isSpaceFormOpen && (
                <HostSpaceForm
                  space={editingSpace || undefined}
                  onSuccess={() => {
                    setIsSpaceFormOpen(false);
                    setEditingSpace(null);
                    queryClient.invalidateQueries({ queryKey: ['host-spaces'] });
                  }}
                  onCancel={() => {
                    setIsSpaceFormOpen(false);
                    setEditingSpace(null);
                  }}
                />
              )}
            </TabsContent>

            {/* Calendar Tab */}
            <TabsContent value="calendar" className="space-y-6">
              <Card className="border border-slate-200 bg-white shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle>Calendar - Events at Your Spaces</CardTitle>
                  <CardDescription>
                    View past and upcoming events happening at your spaces
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {eventsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Upcoming Events (Next 4) */}
                      <div>
                        <h3 className="text-lg font-semibold text-violet mb-3">Upcoming Events</h3>
                        {hostEvents
                          .filter(e => {
                            const eventDate = new Date(`${e.date}T${e.time}`);
                            return eventDate >= new Date();
                          })
                          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                          .slice(0, 4)
                          .map((event) => (
                            <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 text-slate-800 mb-2">
                              <div>
                                <h4 className="font-semibold">{event.title}</h4>
                                <p className="text-sm text-gray-600">
                                  {formatDate(event.date)} • {formatTime(event.time)}
                                </p>
                                <p className="text-sm text-gray-500">{event.venue}, {event.city}</p>
                              </div>
                              <Badge className="bg-green-500">Upcoming</Badge>
                            </div>
                          ))}
                        {hostEvents.filter(e => {
                          const eventDate = new Date(`${e.date}T${e.time}`);
                          return eventDate >= new Date();
                        }).length === 0 && (
                          <p className="text-gray-500 text-center py-4">No upcoming events</p>
                        )}
                      </div>

                      {/* Past Events */}
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold text-violet mb-3">Past Events</h3>
                        {hostEvents
                          .filter(e => {
                            const eventDate = new Date(`${e.date}T${e.time}`);
                            return eventDate < new Date();
                          })
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((event) => (
                            <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 text-slate-800 mb-2 opacity-75">
                              <div>
                                <h4 className="font-semibold">{event.title}</h4>
                                <p className="text-sm text-gray-600">
                                  {formatDate(event.date)} • {formatTime(event.time)}
                                </p>
                                <p className="text-sm text-gray-500">{event.venue}, {event.city}</p>
                              </div>
                              <Badge variant="outline">Past</Badge>
                            </div>
                          ))}
                        {hostEvents.filter(e => {
                          const eventDate = new Date(`${e.date}T${e.time}`);
                          return eventDate < new Date();
                        }).length === 0 && (
                          <p className="text-gray-500 text-center py-4">No past events</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Event Requests Tab */}
            <TabsContent value="requests" className="space-y-6">
              <Card className="border border-slate-200 bg-white shadow-sm rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Event Requests</CardTitle>
                    <CardDescription>
                      Manage your requests to host events at your spaces
                    </CardDescription>
                  </div>
                  <Button onClick={() => setIsEventRequestFormOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Request
                  </Button>
                </CardHeader>
                <CardContent>
                  {requestsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                      ))}
                    </div>
                  ) : eventRequests.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No event requests yet. Click "New Request" to create one.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {eventRequests.map((request) => (
                        <div key={request.id} className="border rounded-lg p-4 bg-slate-50">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-violet">{request.event_title}</h3>
                              <p className="text-sm text-gray-600">
                                {new Date(request.requested_date).toLocaleDateString()} • {request.requested_start_time}
                                {request.requested_end_time && ` - ${request.requested_end_time}`}
                              </p>
                              {request.host_space && (
                                <p className="text-sm text-gray-500">
                                  Space: {request.host_space.name} - {request.host_space.location}
                                </p>
                              )}
                            </div>
                            <Badge 
                              variant={
                                request.status === 'approved' || request.status === 'scheduled' ? 'default' : 
                                request.status === 'pending' ? 'secondary' : 
                                'destructive'
                              }
                            >
                              {request.status}
                            </Badge>
                          </div>
                          {request.event_description && (
                            <p className="text-sm text-gray-600 mb-2">{request.event_description}</p>
                          )}
                          {request.expected_capacity && (
                            <p className="text-sm text-violet">Expected Capacity: {request.expected_capacity}</p>
                          )}
                          {request.rejection_reason && (
                            <p className="text-sm text-red-500 mt-2">Rejection Reason: {request.rejection_reason}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              {isEventRequestFormOpen && (
                <EventRequestForm
                  spaces={hostSpaces}
                  onSuccess={() => {
                    setIsEventRequestFormOpen(false);
                    queryClient.invalidateQueries({ queryKey: ['host-event-requests'] });
                  }}
                  onCancel={() => setIsEventRequestFormOpen(false)}
                />
              )}
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-6">
              <Card className="border border-slate-200 bg-white shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle>Attendance Reports</CardTitle>
                  <CardDescription>
                    Detailed attendance statistics and reports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {attendanceSummary.map((event) => (
                      <div key={event.event_id} className="border rounded-lg p-6 bg-slate-50 text-slate-800">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold">{event.event_title}</h3>
                            <p className="text-sm text-gray-600">
                              {formatDate(event.event_date || '')} • {event.event_city}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">{event.attendance_rate || 0}%</p>
                            <p className="text-sm text-gray-600">Attendance Rate</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold">{event.total_tickets || 0}</p>
                            <p className="text-sm text-gray-600">Total Tickets</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">{event.present_count || 0}</p>
                            <p className="text-sm text-gray-600">Present</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-red-600">{event.absent_count || 0}</p>
                            <p className="text-sm text-gray-600">Absent</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
                </FadeIn>
              </div>
            </main>
          </div>
        </div>
      </Tabs>
    </div>
  );
};

export default function HostDashboardProtected() {
  return (
    <ProtectedRoute hostOnly>
      <HostDashboard />
    </ProtectedRoute>
  );
} 
