import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getEventUrl } from "@/lib/eventUtils";
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
  History,
  Eye,
  ShoppingCart,
  ChevronDown,
  X,
  RefreshCw,
  Heart,
  Share2,
  MoreVertical
} from "lucide-react";
import { FadeIn } from "@/components/ui/motion";
import { getEvents, getEventCities, Event } from "@/services/eventService";
import { getEventTypes, EventType } from "@/services/eventTypeService";
import { Separator } from "@/components/ui/separator";
import { getEventStatus, formatEventStatus } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

const Events = () => {
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedEventType, setSelectedEventType] = useState<string>("");
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [showAllPreviousEvents, setShowAllPreviousEvents] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullToRefreshY, setPullToRefreshY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  
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

  // Read city from query string and set filter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const city = params.get('city');
    if (city) {
      setSelectedCity(city);
    }
  }, [location.search]);

  // If no events for selected city, show coming soon and redirect
  useEffect(() => {
    if (selectedCity && events.length > 0) {
      const cityEvents = events.filter(event => event.city === selectedCity);
      if (cityEvents.length === 0) {
        alert('We are coming soon in your city!');
        navigate('/membership');
      }
    }
  }, [selectedCity, events, navigate]);

  // Get all previous events
  const allPreviousEvents = events.filter(event => {
    const status = getEventStatus(event.date, event.time);
    return status === 'completed';
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Group previous events by date
  const groupPreviousEventsByDate = (events: Event[]) => {
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

  const groupedPreviousEvents = groupPreviousEventsByDate(allPreviousEvents);

  // Apply filters and filter out completed events
  useEffect(() => {
    const applyFilters = async () => {
      let filtered = events.filter(event => {
        const status = getEventStatus(event.date, event.time);
        return status !== 'completed'; // Only show upcoming and ongoing events
      });
      
      if (selectedCity) {
        filtered = filtered.filter(event => event.city === selectedCity);
      }
      
      if (selectedEventType) {
        filtered = filtered.filter(event => event.event_type === selectedEventType);
      }
      
      // Sort by date (earliest first)
      filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
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
    
    // Sort dates
    return Object.keys(grouped).sort().reduce((acc, date) => {
      acc[date] = grouped[date];
      return acc;
    }, {} as { [key: string]: Event[] });
  };

  // Add to cart function
  const handleAddToCart = (event: Event) => {
    const cartItem = {
      id: `cart-${event.id}-${Date.now()}`,
      eventId: event.id,
      eventTitle: event.title,
      eventImage: event.image,
      quantity: 1,
      price: event.has_discount && event.discounted_price ? event.discounted_price : event.price,
      date: event.date,
      venue: event.venue,
      city: event.city,
    };
    
    addItem(cartItem);
    toast({
      title: "Added to Cart",
      description: `${event.title} has been added to your cart.`,
    });
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
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const eventDate = new Date(dateString);
    
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric',
      weekday: 'long'
    };
    
    if (eventDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (eventDate.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return new Date(dateString).toLocaleDateString('en-US', options);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedCity("");
    setSelectedEventType("");
    setShowFilters(false);
  };

  // Pull to refresh functionality
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile || window.scrollY > 0) return;
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || window.scrollY > 0) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0) {
      e.preventDefault();
      const pullDistance = Math.min(diff * 0.5, 100);
      setPullToRefreshY(pullDistance);
      setIsPulling(pullDistance > 50);
    }
  };

  const handleTouchEnd = () => {
    if (!isMobile) return;
    
    if (isPulling && pullToRefreshY > 50) {
      setIsRefreshing(true);
      // Simulate refresh
      setTimeout(() => {
        setIsRefreshing(false);
        setPullToRefreshY(0);
        setIsPulling(false);
        // Trigger a refetch
        window.location.reload();
      }, 1500);
    } else {
      setPullToRefreshY(0);
      setIsPulling(false);
    }
  };

  // Mobile-specific event handlers
  const handleEventCardClick = (event: Event) => {
    if (isMobile) {
      // Add haptic feedback for mobile
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }
    navigate(getEventUrl(event));
  };

  const handleQuickBook = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMobile && 'vibrate' in navigator) {
      navigator.vibrate(30);
    }
    handleAddToCart(event);
  };

  // Mobile swipe gesture handlers
  const handleSwipeStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    const touch = e.touches[0];
    startY.current = touch.clientY;
  };

  const handleSwipeMove = (e: React.TouchEvent) => {
    if (!isMobile) return;
    const touch = e.touches[0];
    const diff = touch.clientY - startY.current;
    
    // Add subtle parallax effect on mobile
    if (Math.abs(diff) > 10) {
      const parallaxAmount = diff * 0.1;
      if (containerRef.current) {
        containerRef.current.style.transform = `translateY(${parallaxAmount}px)`;
      }
    }
  };

  const handleSwipeEnd = () => {
    if (!isMobile || !containerRef.current) return;
    containerRef.current.style.transform = 'translateY(0px)';
  };

  // Mobile search functionality
  const handleMobileSearch = (query: string) => {
    if (!query.trim()) return;
    
    // Filter events by search query
    const searchResults = events.filter(event => 
      event.title.toLowerCase().includes(query.toLowerCase()) ||
      event.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      event.city.toLowerCase().includes(query.toLowerCase()) ||
      event.venue.toLowerCase().includes(query.toLowerCase())
    );
    
    setFilteredEvents(searchResults);
    setShowMobileSearch(false);
    
    if (isMobile && 'vibrate' in navigator) {
      navigator.vibrate(30);
    }
  };

  const groupedEvents = groupEventsByDate(filteredEvents);

  return (
    <div 
      className="min-h-screen flex flex-col"
      onTouchStart={(e) => {
        handleTouchStart(e);
        handleSwipeStart(e);
      }}
      onTouchMove={(e) => {
        handleTouchMove(e);
        handleSwipeMove(e);
      }}
      onTouchEnd={(e) => {
        handleTouchEnd();
        handleSwipeEnd();
      }}
      ref={containerRef}
    >
      <Navbar selectedCity="" setSelectedCity={() => {}} />
      
      {/* Pull to refresh indicator */}
      {isMobile && (
        <div 
          className={`fixed top-16 left-1/2 transform -translate-x-1/2 z-40 transition-all duration-300 ${
            pullToRefreshY > 0 ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ transform: `translate(-50%, ${pullToRefreshY}px)` }}
        >
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 ${
            isPulling ? 'bg-sandstorm/30' : ''
          }`}>
            <RefreshCw className={`h-4 w-4 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="text-white text-sm font-medium">
              {isPulling ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          </div>
        </div>
      )}
      
      <main className="flex-grow pt-16 pb-20 md:pb-0">
        <div className={`container-padding ${isMobile ? 'py-4 px-4' : 'py-8'}`}>
          <div className={`text-center ${isMobile ? 'mb-8' : 'mb-12'}`}>
            <h1 className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-bold mb-4`}>Upcoming Experiences</h1>
            <p className={`text-muted-foreground ${isMobile ? 'text-sm px-4' : 'max-w-2xl mx-auto'}`}>
              Discover and book the best upcoming experiences happening in your city. 
              All experiences are organized by date for easy browsing.
            </p>
            <div className={`mt-6 ${isMobile ? 'flex flex-col gap-3 px-4' : ''}`}>
              <Button variant="outline" asChild className={isMobile ? 'w-full' : ''}>
                <Link to="/previousevents" className="flex items-center gap-2 justify-center">
                  <History className="h-4 w-4" />
                  View Past Experiences
                </Link>
              </Button>
              <Dialog open={showAllPreviousEvents} onOpenChange={setShowAllPreviousEvents}>
                <DialogTrigger asChild>
                  <Button variant="outline" className={`${isMobile ? 'w-full' : 'ml-4'} flex items-center gap-2 justify-center`}>
                    <Eye className="h-4 w-4" />
                    View All Previous Experiences
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      All Previous Experiences
                    </DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    {allPreviousEvents.length === 0 ? (
                      <div className="text-center py-8">
                        <h3 className="text-lg font-medium mb-2">No previous experiences found</h3>
                        <p className="text-muted-foreground">
                          There are no completed experiences to display.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {Object.entries(groupedPreviousEvents).map(([date, dateEvents]) => (
                          <div key={date}>
                            <div className="mb-4">
                              <h3 className="text-xl font-bold text-gray-900 mb-1">
                                {formatDateHeader(date)}
                              </h3>
                              <p className="text-muted-foreground">
                                {formatDate(date)}
                              </p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {dateEvents.map((event, index) => (
                                <Card key={event.id} className="hover-scale border-none shadow-soft overflow-hidden opacity-75 hover:opacity-100 transition-opacity">
                                  <div className="h-32 relative">
                                    <img 
                                      src={event.image} 
                                      alt={event.title} 
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                                      <Badge className="bg-violet hover:bg-violet-700 text-xs">{event.category}</Badge>
                                      <Badge className="bg-gray-100 text-gray-600 border-0 text-xs">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        Event Over
                                      </Badge>
                                    </div>
                                  </div>
                                  <CardContent className="p-3">
                                    <h4 className="text-sm font-bold mb-1 line-clamp-1">{event.title}</h4>
                                    <p className="text-muted-foreground text-xs mb-2 line-clamp-2">{event.subtitle}</p>
                                    
                                    <div className="flex items-center gap-1 text-xs mb-1">
                                      <MapPin className="h-3 w-3 text-red" />
                                      <span>{event.city}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs">
                                      <Clock className="h-3 w-3 text-violet" />
                                      <span>{event.time}</span>
                                    </div>
                                  </CardContent>
                                  <CardFooter className="px-3 pb-3 pt-0 flex justify-between items-center">
                                    <div className="text-sm font-bold">₹{event.price}</div>
                                    <Button variant="outline" size="sm" disabled className="text-gray-500 text-xs">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      Event Over
                                    </Button>
                                  </CardFooter>
                                </Card>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Filters Section */}
          {isMobile ? (
            <div className="mb-6">
              {/* Mobile Filter Toggle */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="w-full flex items-center justify-between bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white hover:bg-white/20"
              >
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                  {(selectedCity || selectedEventType) && (
                    <Badge className="bg-sandstorm text-black text-xs px-2 py-0.5">
                      {[selectedCity, selectedEventType].filter(Boolean).length}
                    </Badge>
                  )}
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </Button>
              
              {/* Mobile Filter Content */}
              {showFilters && (
                <div className="mt-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 space-y-4">
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Filter by city" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Filter by experience type" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map(type => (
                        <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    variant="ghost" 
                    onClick={clearFilters}
                    className="w-full text-white hover:bg-white/20"
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          ) : (
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
                      <SelectValue placeholder="Filter by experience type" />
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
          )}
          
          {/* Experiences by Date */}
          {eventsLoading ? (
            <div className={`flex justify-center ${isMobile ? 'py-12' : 'py-16'}`}>
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sandstorm"></div>
                <p className="text-white/70 text-sm">Loading experiences...</p>
              </div>
            </div>
          ) : Object.entries(groupedEvents).length === 0 ? (
            <div className={`text-center ${isMobile ? 'py-12 px-4' : 'py-16'}`}>
              <div className="flex flex-col items-center space-y-4">
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center">
                  <Calendar className="h-10 w-10 text-white/50" />
                </div>
                <h3 className="text-xl font-semibold text-white">No experiences found</h3>
                <p className="text-white/70 max-w-md">
                  {selectedCity || selectedEventType 
                    ? "No experiences match your current filters. Try adjusting your search criteria."
                    : "No upcoming experiences are available at the moment. Check back soon!"
                  }
                </p>
                {(selectedCity || selectedEventType) && (
                  <Button 
                    onClick={clearFilters}
                    className="mt-4 bg-gradient-to-r from-sandstorm to-raspberry hover:from-raspberry hover:to-violet text-black font-semibold"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className={`space-y-${isMobile ? '8' : '12'}`}>
              {Object.entries(groupedEvents).map(([date, dateEvents]) => (
                <div key={date}>
                  <div className={`${isMobile ? 'mb-4' : 'mb-6'}`}>
                    <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-white mb-2`}>
                      {formatDateHeader(date)}
                    </h2>
                  </div>
                  {/* Event cards grid with yellow padding */}
                  <div className={`bg-sandstorm rounded-3xl ${isMobile ? 'px-4 py-6' : 'px-8 py-8'}`}>
                    <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'}`}>
                      {dateEvents.map((event, index) => (
                        <FadeIn key={event.id} delay={index * 100}>
                          <Card 
                            className={`hover-scale border-none shadow-soft overflow-hidden ${isMobile ? 'cursor-pointer' : ''}`}
                            onClick={() => handleEventCardClick(event)}
                          >
                            <div className={`${isMobile ? 'h-40' : 'h-48'} relative group`}>
                              <img 
                                src={event.image} 
                                alt={event.title} 
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              <div className={`absolute ${isMobile ? 'top-2 right-2' : 'top-3 right-3'} flex flex-col gap-2`}>
                                <Badge className="bg-violet hover:bg-violet-700 text-xs">{event.category}</Badge>
                                {(() => {
                                  const status = getEventStatus(event.date, event.time);
                                  const statusInfo = formatEventStatus(status);
                                  return (
                                    <Badge className={`${statusInfo.bgColor} ${statusInfo.color} border-0 text-xs`}>
                                      {statusInfo.text}
                                    </Badge>
                                  );
                                })()}
                              </div>
                              {/* Mobile quick actions overlay */}
                              {isMobile && (
                                <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  <Button
                                    size="sm"
                                    className="h-8 w-8 p-0 bg-white/20 backdrop-blur-md border border-white/30 rounded-full"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if ('vibrate' in navigator) navigator.vibrate(30);
                                    }}
                                  >
                                    <Heart className="h-3 w-3 text-white" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="h-8 w-8 p-0 bg-white/20 backdrop-blur-md border border-white/30 rounded-full"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if ('vibrate' in navigator) navigator.vibrate(30);
                                    }}
                                  >
                                    <Share2 className="h-3 w-3 text-white" />
                                  </Button>
                                </div>
                              )}
                            </div>
                            <CardContent className={`${isMobile ? 'p-4' : 'p-5'} text-black`}>
                              <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold mb-1 line-clamp-1`}>{event.title}</h3>
                              <p className={`${isMobile ? 'text-xs' : 'text-sm'} mb-4 line-clamp-2`}>{event.subtitle}</p>
                              <div className="flex items-center gap-2 text-sm mb-2">
                                <MapPin className="h-4 w-4 text-red-500" />
                                <span>{event.city}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-violet-500" />
                                <span>{event.time}</span>
                              </div>
                            </CardContent>
                            <CardFooter className={`${isMobile ? 'px-4 pb-4 pt-0' : 'px-5 pb-5 pt-0'} flex justify-between items-center text-black`}>
                              {event.has_discount && event.real_price && event.discounted_price ? (
                                <div className="flex flex-col items-start">
                                  <span className={`${isMobile ? 'text-sm' : 'text-base'} opacity-60 line-through decoration-2 decoration-red-500`}>₹{event.real_price}</span>
                                  <span className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-red-600`}>₹{event.discounted_price}</span>
                                </div>
                              ) : (
                                <div className={`${isMobile ? 'text-base' : 'text-lg'} font-bold`}>₹{event.price}</div>
                              )}
                              <div className="flex gap-2">
                                {isMobile ? (
                                  <Button 
                                    size="sm" 
                                    className="bg-gradient-to-r from-violet to-raspberry hover:from-raspberry hover:to-violet text-white font-semibold"
                                    onClick={(e) => handleQuickBook(event, e)}
                                  >
                                    Book
                                  </Button>
                                ) : (
                                  <Button 
                                    asChild 
                                    size="sm" 
                                    onClick={() => navigate(getEventUrl(event))}
                                  >
                                    <span>Book Now</span>
                                  </Button>
                                )}
                              </div>
                            </CardFooter>
                          </Card>
                        </FadeIn>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      
      {/* Mobile Search Overlay */}
      {isMobile && showMobileSearch && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          <div className="absolute top-20 left-4 right-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <Search className="h-5 w-5 text-white" />
              <input
                type="text"
                placeholder="Search experiences, venues, cities..."
                className="flex-1 bg-transparent text-white placeholder:text-white/60 outline-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleMobileSearch(e.currentTarget.value);
                  } else if (e.key === 'Escape') {
                    setShowMobileSearch(false);
                  }
                }}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowMobileSearch(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={(e) => {
                const input = e.currentTarget.parentElement?.querySelector('input');
                if (input) handleMobileSearch(input.value);
              }}
              className="w-full bg-gradient-to-r from-sandstorm to-raspberry hover:from-raspberry hover:to-violet text-black font-semibold"
            >
              Search
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Floating Action Buttons */}
      {isMobile && (
        <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-3">
          {/* Quick Search FAB */}
          <Button
            size="icon"
            className="h-12 w-12 rounded-full bg-gradient-to-r from-sandstorm to-raspberry hover:from-raspberry hover:to-violet shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
            onClick={() => {
              if ('vibrate' in navigator) navigator.vibrate(30);
              setShowMobileSearch(true);
            }}
          >
            <Search className="h-5 w-5 text-black" />
          </Button>
          
          {/* Filter Toggle FAB */}
          <Button
            size="icon"
            className={`h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 ${
              showFilters 
                ? 'bg-gradient-to-r from-violet to-raspberry' 
                : 'bg-white/20 backdrop-blur-md border border-white/30'
            }`}
            onClick={() => {
              if ('vibrate' in navigator) navigator.vibrate(30);
              setShowFilters(!showFilters);
            }}
          >
            <Filter className={`h-5 w-5 ${showFilters ? 'text-white' : 'text-white'}`} />
          </Button>
        </div>
      )}
      
      {/* Only show Footer on desktop */}
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
};

export default Events;
