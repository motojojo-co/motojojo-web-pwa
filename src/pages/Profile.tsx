import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { FadeIn } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import EventTicket from "@/components/tickets/EventTicket";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useCategories } from "@/hooks/use-categories";
import { useToast } from "@/hooks/use-toast";
import { Check, UserRound, MapPin, Phone, Mail, Ticket, Clock, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getUserBookings, getBookingTickets, Booking, Ticket as TicketType, subscribeToBookingUpdates, generateTicketsForBooking, resendTicketEmail, markTicketsAsAttended } from "@/services/bookingService";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { isEventOver } from "@/lib/utils";

const Profile = () => {
  const { toast } = useToast();
  // Fetch latest Clerk data and Supabase-stored profile
  const { user, profile, isLoaded, isSignedIn, updateProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const defaultTab = queryParams.get('tab') === 'bookings' ? 'bookings' : 'profile';
  const showSuccessMessage = queryParams.get('success') === 'true';
  
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [userProfile, setUserProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    city: "",
    preferences: [] as number[]
  });
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [ticketsForBooking, setTicketsForBooking] = useState<TicketType[]>([]);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  // Get categories for preferences
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  
  // Update active tab when URL changes
  useEffect(() => {
    const tab = queryParams.get('tab') === 'bookings' ? 'bookings' : 'profile';
    setActiveTab(tab);
  }, [location.search]);
  
  // Modified fetching logic
  const { 
    data: bookings = [], 
    isLoading: bookingsLoading,
    error: bookingsError,
    refetch: refetchBookings
  } = useQuery({
    queryKey: ['bookings', user?.id],
    queryFn: () => getUserBookings(user?.id || ''),
    enabled: !!isSignedIn && !!user?.id,
    retry: 1
  });

  // Effect to handle loading states
  useEffect(() => {
    if (!isLoaded || !profile) {
      return;
    }

    if (bookingsError) {
      toast({
        title: "Error Loading Bookings",
        description: "There was a problem loading your bookings. Please try again.",
        variant: "destructive"
      });
    }
  }, [isLoaded, profile, bookingsError, toast]);

  // Show success message when redirected from successful booking
  useEffect(() => {
    if (showSuccessMessage) {
      toast({
        title: "Booking Successful!",
        description: "Your tickets have been booked successfully and sent to your email.",
      });
      // Clear the success parameter from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('success');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [showSuccessMessage, toast]);
  
  // Keep everything in sync if user/Clerk data changes
  useEffect(() => {
    if (user && profile) {
      setUserProfile({
        full_name: profile.full_name || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        email: profile.email || user.primaryEmailAddress?.emailAddress || "",
        phone: profile.phone || "",
        city: profile.city || "",
        preferences: profile.preferences
          ? typeof profile.preferences === "string"
            ? JSON.parse(profile.preferences)
            : profile.preferences
          : [],
      });
    }
  }, [user, profile]);
  
  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to view your profile.",
      });
      navigate("/");
    }
  }, [isLoaded, isSignedIn, navigate, toast]);
  
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    
    try {
      const result = await updateProfile({
        full_name: userProfile.full_name,
        phone: userProfile.phone,
        city: userProfile.city,
        preferences: userProfile.preferences
      });
      
      if (result) {
        toast({
          title: "Profile Updated",
          description: "Your profile has been successfully updated.",
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update Failed",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };
  
  const handleInterestToggle = (categoryId: number) => {
    setUserProfile(prev => {
      const preferences = [...prev.preferences];
      
      if (preferences.includes(categoryId)) {
        return {
          ...prev,
          preferences: preferences.filter(id => id !== categoryId)
        };
      } else {
        return {
          ...prev,
          preferences: [...preferences, categoryId]
        };
      }
    });
  };

  const handleSavePreferences = async () => {
    setIsSavingPreferences(true);
    try {
      const result = await updateProfile({
        preferences: userProfile.preferences
      });
      
      if (result) {
        toast({
          title: "Preferences Saved",
          description: "Your interests have been successfully updated.",
        });
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Save Failed",
        description: "There was an error saving your preferences. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const handleDownloadTicket = async (ticket: TicketType) => {
    // Create a temporary link to download the QR code
    if (ticket.qr_code) {
      const link = document.createElement('a');
      link.href = ticket.qr_code;
      link.download = `ticket-${ticket.ticket_number}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Modified handleViewTickets to ensure tickets exist and use real-time updates
  const handleViewTickets = async (booking: Booking) => {
    setSelectedBooking(booking);
    setIsTicketDialogOpen(true);
    
    // If event is completed, automatically mark tickets as attended
    if (booking.event && isEventOver(booking.event.date, booking.event.time)) {
      try {
        await markTicketsAsAttended(booking.event_id);
        // Refetch bookings to get updated attendance status
        refetchBookings();
        toast({
          title: "Tickets Updated",
          description: "Tickets have been marked as attended for this completed event.",
        });
      } catch (error) {
        console.error("Error marking tickets as attended:", error);
      }
    }
  };

  // Handle resending tickets via email
  const handleResendEmail = async () => {
    if (!selectedBooking) return;
    
    try {
      const success = await resendTicketEmail(selectedBooking);
      
      if (success) {
        toast({
          title: "Email Sent!",
          description: "Your tickets have been sent to your email address.",
        });
      } else {
        toast({
          title: "Email Failed",
          description: "Failed to send tickets via email. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error resending email:", error);
      toast({
        title: "Email Error",
        description: "There was an error sending your tickets. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle resending tickets via email from booking card
  const handleResendEmailForBooking = async (booking: Booking) => {
    try {
      const success = await resendTicketEmail(booking);
      
      if (success) {
        toast({
          title: "Email Sent!",
          description: "Your tickets have been sent to your email address.",
        });
      } else {
        toast({
          title: "Email Failed",
          description: "Failed to send tickets via email. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error resending email:", error);
      toast({
        title: "Email Error",
        description: "There was an error sending your tickets. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="w-full max-w-md mx-auto p-6">
            <Skeleton className="h-8 w-3/4 mb-6" />
            <Skeleton className="h-32 w-full mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-20 md:pb-16">
        <div className="container-padding">
          <FadeIn>
            <h1 className="text-3xl md:text-4xl font-bold mb-8">My Profile</h1>
          </FadeIn>
          
          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full md:w-[400px] grid-cols-2 mb-8">
              <TabsTrigger value="profile">Profile Details</TabsTrigger>
              <TabsTrigger value="bookings">My Bookings</TabsTrigger>
            </TabsList>
            
            {/* Profile Tab */}
            <TabsContent value="profile">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <FadeIn delay={100} className="md:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>
                        Update your personal details
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleProfileUpdate} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="full_name">Full Name</Label>
                            <div className="flex">
                              <UserRound className="mr-2 h-4 w-4 text-muted-foreground mt-3" />
                              <Input 
                                id="full_name" 
                                value={userProfile.full_name} 
                                onChange={e => setUserProfile({...userProfile, full_name: e.target.value})}
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="flex">
                              <Mail className="mr-2 h-4 w-4 text-muted-foreground mt-3" />
                              <Input 
                                id="email" 
                                type="email" 
                                value={user?.primaryEmailAddress?.emailAddress || ''}
                                disabled
                                className="bg-gray-100"
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <div className="flex">
                              <Phone className="mr-2 h-4 w-4 text-muted-foreground mt-3" />
                              <Input 
                                id="phone" 
                                value={userProfile.phone} 
                                onChange={e => setUserProfile({...userProfile, phone: e.target.value})}
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <div className="flex">
                              <MapPin className="mr-2 h-4 w-4 text-muted-foreground mt-3" />
                              <Input 
                                id="city" 
                                value={userProfile.city} 
                                onChange={e => setUserProfile({...userProfile, city: e.target.value})}
                              />
                            </div>
                          </div>
                        </div>
                        
                        <Button type="submit" disabled={isUpdatingProfile}>
                          {isUpdatingProfile ? "Updating..." : "Update Profile"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </FadeIn>
                
                <FadeIn delay={200}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Interests & Preferences</CardTitle>
                      <CardDescription>
                        Select your interests to get personalized recommendations
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {categoriesLoading ? (
                          // Loading skeleton for categories
                          Array.from({ length: 8 }).map((_, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Skeleton className="h-4 w-4" />
                              <Skeleton className="h-4 w-24" />
                            </div>
                          ))
                        ) : (
                          categories.map(category => (
                            <div key={category.id} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`category-${category.id}`}
                                checked={userProfile.preferences.includes(category.id)}
                                onCheckedChange={() => handleInterestToggle(category.id)}
                              />
                              <Label 
                                htmlFor={`category-${category.id}`}
                                className="cursor-pointer"
                              >
                                {category.name}
                              </Label>
                            </div>
                          ))
                        )}
                        
                        <Button 
                          type="button" 
                          className="w-full mt-4"
                          onClick={handleSavePreferences}
                          disabled={categoriesLoading || isSavingPreferences}
                        >
                          {isSavingPreferences ? "Saving..." : "Save Preferences"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </FadeIn>
              </div>
            </TabsContent>
            
            {/* Bookings Tab */}
            <TabsContent value="bookings">
              <FadeIn>
                <div className="grid grid-cols-1 gap-6">
                  {bookingsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-pulse">Loading your bookings...</div>
                    </div>
                  ) : bookings.length > 0 ? (
                    bookings.map((booking) => (
                      <Card key={booking.id} className="overflow-hidden border-none shadow-soft">
                        <div className="md:flex">
                          <div className="md:w-1/4 h-48 md:h-auto">
                            {booking.event && (
                              <img 
                                src={booking.event.image} 
                                alt={booking.event.title} 
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="p-6 md:w-3/4">
                            <div className="flex flex-col md:flex-row justify-between mb-4">
                              <div>
                                <h3 className="text-xl font-bold mb-1">
                                  {booking.event ? booking.event.title : "Event details not available"}
                                </h3>
                                <p className="text-muted-foreground">
                                  {booking.event ? booking.event.subtitle : ""}
                                </p>
                              </div>
                              <div className="mt-2 md:mt-0 flex items-center">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                  booking.status === 'confirmed' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {booking.status === 'confirmed' && <Check className="mr-1 h-3 w-3" />}
                                  {booking.status}
                                </span>
                                {booking.event && isEventOver(booking.event.date, booking.event.time) && (
                                  <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    <CheckCircle className="mr-1 h-3 w-3" />
                                    Event Completed
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              {booking.event && (
                                <>
                                  <div>
                                    <div className="text-sm text-muted-foreground">Event Date</div>
                                    <div className="font-medium">{formatDate(booking.event.date)}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm text-muted-foreground">Booking Date</div>
                                    <div className="font-medium">{formatDate(booking.booking_date)}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm text-muted-foreground">Venue</div>
                                    <div className="font-medium">{booking.event.venue}, {booking.event.city}</div>
                                  </div>
                                </>
                              )}
                            </div>
                            
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-4 pt-4 border-t border-border">
                              <div>
                                <div className="text-sm text-muted-foreground">Tickets</div>
                                <div className="font-medium">
                                  {booking.tickets} x ₹{booking.event ? booking.event.price : 0}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Total Amount</div>
                                <div className="text-lg font-bold">₹{booking.amount}</div>
                              </div>
                              <div className="flex flex-col md:flex-row gap-2 mt-4 md:mt-0">
                                <Button 
                                  variant="default"
                                  onClick={() => handleViewTickets(booking)}
                                  className="flex items-center gap-2 bg-sandstorm hover:bg-sandstorm/90 text-black"
                                >
                                  <Ticket className="h-4 w-4" />
                                  View Tickets
                                </Button>
                                <Button 
                                  variant="outline"
                                  onClick={() => navigate(`/ticket-preview/${booking.id}`)}
                                  className="border-sandstorm text-sandstorm hover:bg-sandstorm/10"
                                >
                                  <Ticket className="h-4 w-4" />
                                  Ticket Preview
                                </Button>
                                <Button 
                                  variant="outline"
                                  onClick={() => handleResendEmailForBooking(booking)}
                                  className="border-sandstorm text-sandstorm hover:bg-sandstorm/10"
                                >
                                  <Mail className="h-4 w-4" />
                                  Resend Email
                                </Button>
                                {booking.event && (
                                  <Button 
                                    variant="outline"
                                    onClick={() => navigate(`/event/${booking.event.id}`)}
                                    className="border-sandstorm text-sandstorm hover:bg-sandstorm/10"
                                  >
                                    View Event
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <Card className="p-8 text-center">
                      <h3 className="text-xl font-medium mb-2">No Bookings Yet</h3>
                      <p className="text-muted-foreground mb-6">You haven't booked any events yet. Explore our exciting events and book your first experience!</p>
                      <Button 
                        onClick={() => navigate("/")}
                      >
                        Explore Events
                      </Button>
                    </Card>
                  )}
                </div>
              </FadeIn>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      {/* Updated Ticket Dialog */}
      <Dialog open={isTicketDialogOpen} onOpenChange={setIsTicketDialogOpen}>
        <DialogContent className="sm:max-w-4xl lg:max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 bg-background z-10 pb-4 border-b">
            <DialogTitle>Your Tickets</DialogTitle>
            <DialogDescription>
              {selectedBooking?.event?.title} - {ticketsForBooking.length} ticket{ticketsForBooking.length !== 1 ? 's' : ''}
            </DialogDescription>
            {ticketsForBooking.length > 3 && (
              <div className="text-sm text-muted-foreground mt-2">
                Scroll to view all tickets
              </div>
            )}
          </DialogHeader>
          
          <div className="py-6">
            {ticketsForBooking.length > 0 ? (
              <div className={`grid gap-6 ${
                ticketsForBooking.length === 1 
                  ? 'grid-cols-1 max-w-xl mx-auto' 
                  : ticketsForBooking.length === 2 
                    ? 'grid-cols-1 md:grid-cols-2' 
                    : ticketsForBooking.length === 3 
                      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              }`}>
                {ticketsForBooking.map((ticket, index) => (
                  <div key={ticket.id} className="relative">
                    <div className="absolute -top-2 -left-2 bg-raspberry text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center z-30">
                      {index + 1}
                    </div>
                    {ticket.attended && (
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold rounded-full px-2 py-1 flex items-center gap-1 z-30">
                        <CheckCircle className="h-3 w-3" />
                        Attended
                      </div>
                    )}
                    <EventTicket
                      ticketId={ticket.ticket_number}
                      imageUrl={selectedBooking?.event?.image || '/placeholder.svg'}
                      eventName={selectedBooking?.event?.title || 'Event'}
                      eventDescription={selectedBooking?.event?.subtitle || ''}
                      date={selectedBooking?.event?.date || ''}
                      time={selectedBooking?.event?.time || ''}
                      venue={`${selectedBooking?.event?.venue || ''}, ${selectedBooking?.event?.city || ''}`}
                      price={selectedBooking?.amount ? selectedBooking.amount / selectedBooking.tickets : 0}
                      username={selectedBooking?.name || 'Guest'}
                      qrCode={ticket.qr_code}
                    />
                    <Button
                      className="absolute top-4 right-4 bg-sandstorm hover:bg-sandstorm/90 text-black z-20"
                      onClick={() => handleDownloadTicket(ticket)}
                    >
                      Download QR
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                No tickets found for this booking.
              </div>
            )}
          </div>
          
          <div className="sticky bottom-0 bg-background pt-4 border-t flex justify-end gap-2">
            <Button 
              variant="outline"
              onClick={handleResendEmail}
              className="border-sandstorm text-sandstorm hover:bg-sandstorm/10"
            >
              <Mail className="h-4 w-4 mr-2" />
              Resend Email
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsTicketDialogOpen(false)}
              className="border-sandstorm text-sandstorm hover:bg-sandstorm/10"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
};

export default Profile;
