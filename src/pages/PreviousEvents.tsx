import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Calendar,
  MapPin,
  Clock,
  Filter,
  Search,
  AlertCircle,
  Calendar as CalendarIcon,
  List,
  ShoppingCart
} from "lucide-react";
import { FadeIn } from "@/components/ui/motion";
import { getEvents, getEventCities, Event } from "@/services/eventService";
import { getEventTypes, EventType } from "@/services/eventTypeService";
import { Separator } from "@/components/ui/separator";
import { getEventStatus, formatEventStatus } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import { useToast } from "@/hooks/use-toast";

const PreviousEvents = () => {
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedEventType, setSelectedEventType] = useState<string>("");
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [showAllEventsList, setShowAllEventsList] = useState(false);
  
  // Fetch all events
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => getEvents()
  });

  // Fetch cities
  const { data: cities = [] } = useQuery({
    queryKey: ['event-cities'],
    queryFn: getEventCities
  });

  // Fetch event types
  const { data: eventTypes = [] } = useQuery({
    queryKey: ['event-types'],
    queryFn: getEventTypes
  });

  // Apply filters and filter to only completed events
  useEffect(() => {
    const applyFilters = async () => {
      let filtered = events.filter(event => {
        const status = getEventStatus(event.date, event.time);
        return status === 'completed'; // Only show completed events
      });
      
      if (selectedCity) {
        filtered = filtered.filter(event => event.city === selectedCity);
      }
      
      if (selectedEventType) {
        filtered = filtered.filter(event => event.event_type === selectedEventType);
      }
      
      // Sort by date (most recent first)
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setFilteredEvents(filtered);
    };
    
    applyFilters();
  }, [events, selectedCity, selectedEventType]);

  // Group events by date
  const groupEventsByDate = (events: Event[]) => {
    const grouped: { [key: string]: Event[] } = {};
    
    events.forEach(event => {
      const dateKey = event.date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    
    // Sort dates (most recent first)
    return Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).reduce((acc, date) => {
      acc[date] = grouped[date];
      return acc;
    }, {} as { [key: string]: Event[] });
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      weekday: 'long'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Format date for grouping header
  const formatDateHeader = (dateString: string) => {
    if (!dateString) return '';
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const eventDate = new Date(dateString);
    
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric',
      weekday: 'long'
    };
    
    if (eventDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return new Date(dateString).toLocaleDateString('en-US', options);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedCity("");
    setSelectedEventType("");
  };

  // Remove the Add to Cart button and its handler from the previous events page.

  const groupedEvents = groupEventsByDate(filteredEvents);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-16 pb-20 md:pb-0">
        <div className="container-padding py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Past Experiences</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Browse through our past experiences and relive the amazing experiences we've created together.
              All experiences are organized by date for easy browsing.
            </p>
            <div className="mt-6">
              <Button variant="outline" asChild>
                <Link to="/events" className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  View Upcoming Experiences
                </Link>
              </Button>
              <Dialog open={showAllEventsList} onOpenChange={setShowAllEventsList}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="ml-4 flex items-center gap-2">
                    <List className="h-4 w-4" />
                    View All Experiences List
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <List className="h-5 w-5" />
                      All Previous Experiences List
                    </DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    {filteredEvents.length === 0 ? (
                      <div className="text-center py-8">
                        <h3 className="text-lg font-medium mb-2">No previous experiences found</h3>
                        <p className="text-muted-foreground">
                          There are no completed experiences to display.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredEvents.map((event, index) => (
                          <Card key={event.id} className="flex items-center p-4 opacity-75 hover:opacity-100 transition-opacity">
                            <div className="w-16 h-16 rounded-lg overflow-hidden mr-4 flex-shrink-0">
                              <img 
                                src={event.image} 
                                alt={event.title} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm mb-1 line-clamp-1">{event.title}</h4>
                              <p className="text-muted-foreground text-xs mb-2 line-clamp-1">{event.subtitle}</p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  <span>{event.city}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatDate(event.date)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{event.time}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Badge className="bg-violet hover:bg-violet-700 text-xs">{event.category}</Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 ml-4">
                              <div className="text-sm font-bold">₹{event.price}</div>
                              <Badge className="bg-gray-100 text-gray-600 border-0 text-xs">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Event Over
                              </Badge>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Filters Section */}
          <div className="bg-card border rounded-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-xl font-semibold">Filters</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow max-w-2xl">
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by event type" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button variant="ghost" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
          
          {/* Events by Date */}
          {eventsLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-pulse flex space-x-4">
                <div className="h-12 w-12 bg-slate-200 rounded-full"></div>
                <div className="space-y-4 flex-1">
                  <div className="h-4 bg-slate-200 rounded"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          ) : Object.keys(groupedEvents).length === 0 ? (
            <div className="text-center py-16">
              <h3 className="text-xl font-medium mb-2">No past experiences found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or check our upcoming experiences.
              </p>
              {(selectedCity || selectedEventType) && (
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={clearFilters}
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-12">
              {Object.entries(groupedEvents).map(([date, dateEvents]) => (
                <div key={date}>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {formatDateHeader(date)}
                    </h2>
                    <p className="text-muted-foreground">
                      {formatDate(date)}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dateEvents.map((event, index) => (
                      <FadeIn key={event.id} delay={index * 100}>
                        <Card className="hover-scale border-none shadow-soft overflow-hidden opacity-75 hover:opacity-100 transition-opacity">
                          <div className="aspect-[9/16] h-96 relative">
                            <img 
                              src={event.image} 
                              alt={event.title} 
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-3 right-3 flex flex-col gap-2">
                              <Badge className="bg-violet hover:bg-violet-700">{event.category}</Badge>
                              <Badge className="bg-gray-100 text-gray-600 border-0">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Event Over
                              </Badge>
                            </div>
                          </div>
                          <CardContent className="p-5">
                            <h3 className="text-lg font-bold mb-1">{event.title}</h3>
                            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{event.subtitle}</p>
                            
                            <div className="flex items-center gap-2 text-sm mb-2">
                              <MapPin className="h-4 w-4 text-red" />
                              <span>{event.city}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-violet" />
                              <span>{event.time}</span>
                            </div>
                          </CardContent>
                          <CardFooter className="px-5 pb-5 pt-0 flex justify-between items-center">
                            <div className="text-lg font-bold">₹{event.price}</div>
                            <Button variant="outline" disabled className="text-gray-500">
                              <AlertCircle className="h-4 w-4 mr-2" />
                              Event Over
                            </Button>
                          </CardFooter>
                        </Card>
                      </FadeIn>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PreviousEvents; 