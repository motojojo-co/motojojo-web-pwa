import React from "react";
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Tag,
  DollarSign,
  AlertCircle,
  Lock,
  LogIn,
} from "lucide-react";
import {
  getEvent,
  getEventsByCategory,
  type Event,
} from "@/services/eventService";
import { generateSlug } from "@/lib/urlUtils";
import { getEventUrl } from "@/lib/eventUtils";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getEventStatus, formatEventStatus } from "@/lib/utils";
import MovingPartyBackground from "@/components/ui/MovingPartyBackground";
import { getEventTypes } from "@/services/eventTypeService";
import { useAuth } from "@/hooks/use-auth";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import { canViewPrivateEvent } from "@/utils/eventUtils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  createJoinRequest,
  getMyInvitationStatusForEvent,
} from "@/services/eventInvitationService";
// Swiper imports
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const EventDetail = () => {
  const {
    id,
    eventId,
    city: urlCity,
    eventName,
  } = useParams<{
    id?: string;
    eventId?: string;
    city?: string;
    eventName?: string;
  }>();

  // Use eventId if available (new URL format), otherwise use id (old format)
  const effectiveEventId = eventId || id;

  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [isLocalGathering, setIsLocalGathering] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [myInviteStatus, setMyInviteStatus] = useState<
    "pending" | "accepted" | "declined" | null
  >(null);
  // --- ADDED: State for the countdown timer ---
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const { isSignedIn, user } = useAuth();

  const handleRequestToJoin = async () => {
    if (!event) return;
    if (!isSignedIn) {
      navigate(
        `/auth?redirect=${encodeURIComponent(window.location.pathname)}`
      );
      return;
    }
    const { error } = await createJoinRequest(event.id);
    if (error) {
      toast({
        title: "Error",
        description: "Could not submit request.",
        variant: "destructive",
      });
      return;
    }
    setMyInviteStatus("pending");
    toast({
      title: "Request sent",
      description: "We'll notify you once your request to join is reviewed.",
    });
  };

  // Check if user has access to a private event
  const checkEventAccess = useCallback(async (event: Event) => {
    if (!event) return false;

    // If event is not private, access is granted
    if (!event.is_private) return true;

    // Check if user has access to this private event
    const hasAccess = await canViewPrivateEvent(event);
    return hasAccess;
  }, []);

  // Fetch event details with proper TypeScript types
  const {
    data: eventData,
    isLoading: eventLoading,
    error: eventError,
    refetch: refetchEvent,
  } = useQuery<Event | null, Error, Event>({
    queryKey: ["event", effectiveEventId],
    queryFn: async () => {
      if (!effectiveEventId) {
        throw new Error("Event ID is missing");
      }
      const event = await getEvent(effectiveEventId);

      if (!event) return null;

      // If we're using the old URL format and have the event data,
      // redirect to the new URL format
      if (!eventId) {
        const newPath = `/events/${generateSlug(event.city)}/${generateSlug(
          event.title
        )}/${event.id}`;
        navigate(newPath, { replace: true });
        return event;
      }

      // If we're using the new URL format but the event name or city doesn't match,
      // redirect to the correct URL
      if (
        generateSlug(event.title) !== eventName ||
        generateSlug(event.city) !== urlCity
      ) {
        const newPath = `/events/${generateSlug(event.city)}/${generateSlug(
          event.title
        )}/${event.id}`;
        navigate(newPath, { replace: true });
        return event;
      }

      // Check access for private events
      const accessGranted = await checkEventAccess(event);
      setHasAccess(accessGranted);

      // If no access and user is not signed in, show sign in prompt
      if (!accessGranted && !isSignedIn) {
        toast({
          title: "Sign in required",
          description: "Please sign in to view this private event.",
          variant: "default",
          action: (
            <Button
              variant="outline"
              onClick={() =>
                navigate("/sign-in", {
                  state: { from: window.location.pathname },
                })
              }
              className="ml-2"
            >
              Sign In
            </Button>
          ),
        });
      }

      return event;
    },
    enabled: !!effectiveEventId,
  });

  // Handle query errors
  useEffect(() => {
    if (eventError) {
      console.error("Error fetching event:", eventError);
      toast({
        title: "Error",
        description: "Failed to load event details. Please try again.",
        variant: "destructive",
      });
    }
  }, [eventError, toast]);

  // Use the event data from the query
  const event = eventData;

  // Update access status when event data or auth status changes
  useEffect(() => {
    const checkAccess = async () => {
      if (!event) return;

      const accessGranted = await checkEventAccess(event);
      setHasAccess(accessGranted);
      setIsCheckingAccess(false);

      // Also fetch current user's invitation status for private events
      if (event.is_private) {
        const status = await getMyInvitationStatusForEvent(event.id);
        setMyInviteStatus(status);
      } else {
        setMyInviteStatus(null);
      }
    };

    checkAccess();
  }, [event, isSignedIn, user, checkEventAccess]);

  // --- ADDED: useEffect for the countdown timer logic ---
  useEffect(() => {
    if (!event?.date) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      // Combine date and time for a more accurate countdown
      const eventDateTime = new Date(
        `${event.date}T${event.time || "00:00:00"}`
      ).getTime();
      const distance = eventDateTime - now;

      if (distance > 0) {
        setCountdown({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor(
            (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          ),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      } else {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [event?.date, event?.time]);

  // Fetch similar events
  const { data: similarEvents = [], isLoading: similarEventsLoading } =
    useQuery({
      queryKey: ["similarEvents", event?.category],
      queryFn: () => getEventsByCategory(event?.category || ""),
      enabled: !!event?.category,
      select: (data) => data.filter((e) => e.id !== event?.id).slice(0, 3),
    });

  // Fetch event types to check if this is a Local Gathering event
  const { data: eventTypes = [] } = useQuery({
    queryKey: ["event-types"],
    queryFn: getEventTypes,
  });

  // Check if this is a Local Gathering event
  useEffect(() => {
    if (event && eventTypes.length > 0) {
      const localGatheringType = eventTypes.find(
        (et) => et.name.toLowerCase() === "local gathering"
      );
      setIsLocalGathering(
        localGatheringType && event.event_type === localGatheringType.id
      );
    }
  }, [event, eventTypes]);

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  const formatPrice = (price: number): string => {
    return price.toLocaleString("en-IN");
  };

  // Get event status
  const eventStatus = event
    ? getEventStatus(event.date, event.time)
    : "upcoming";
  const statusInfo = formatEventStatus(eventStatus);
  const isCompleted = eventStatus === "completed";

  if (eventLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar selectedCity={selectedCity} setSelectedCity={setSelectedCity} />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-pulse">Loading event details...</div>
        </div>
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar selectedCity={selectedCity} setSelectedCity={setSelectedCity} />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
            <p className="text-muted-foreground">
              The event you're looking for doesn't exist or has been removed.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Logic for collapsible description
  const fullDescription = `${event.description}\n\n${
    event.long_description || ""
  }`.trim();
  const TRUNCATE_LENGTH = 350;
  const shouldTruncate = fullDescription.length > TRUNCATE_LENGTH;

  // Function to render formatted description with highlights and structure
  const renderFormattedDescription = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const elements: JSX.Element[] = [];
    let currentIndex = 0;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) return;

      // Detect questions (lines ending with ?)
      if (trimmedLine.endsWith('?')) {
        elements.push(
          <div key={index} className="mb-4">
            <p className="text-xl font-semibold text-amber-800 mb-2 leading-relaxed">
              {trimmedLine}
            </p>
          </div>
        );
      }
      // Detect section headers (lines with colons or specific patterns)
      else if (trimmedLine.includes(':') && (trimmedLine.includes('What') || trimmedLine.includes('expect') || trimmedLine.includes('note'))) {
        elements.push(
          <div key={index} className="mb-4">
            <h4 className="text-lg font-bold text-amber-900 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              {trimmedLine}
            </h4>
          </div>
        );
      }
      // Detect bullet points or list items
      else if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
        elements.push(
          <div key={index} className="mb-3 ml-4">
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2.5 flex-shrink-0"></div>
              <p className="text-base leading-relaxed text-gray-800">
                {trimmedLine.substring(1).trim()}
              </p>
            </div>
          </div>
        );
      }
      // Detect emphasis text (lines with specific keywords)
      else if (trimmedLine.includes('MEMBER-only') || trimmedLine.includes('curated experience') || trimmedLine.includes('true self')) {
        elements.push(
          <div key={index} className="mb-4">
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
              <p className="text-base font-medium text-amber-900 leading-relaxed">
                {trimmedLine}
              </p>
            </div>
          </div>
        );
      }
      // Detect call-to-action or closing lines
      else if (trimmedLine.includes('book your tickets') || trimmedLine.includes('See you on') || trimmedLine.includes('Love, Team')) {
        elements.push(
          <div key={index} className="mb-4">
            <p className="text-base font-semibold text-amber-800 leading-relaxed">
              {trimmedLine}
            </p>
          </div>
        );
      }
      // Regular paragraphs
      else {
        elements.push(
          <div key={index} className="mb-4">
            <p className="text-base leading-relaxed text-gray-800">
              {trimmedLine}
            </p>
          </div>
        );
      }
    });

    return elements;
  };

  return (
    <div
      className={`min-h-screen flex flex-col ${isLocalGathering ? "" : ""}`}
      style={isLocalGathering ? { backgroundColor: "#0CA678" } : {}}
    >
      <Navbar
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        bgColor={isLocalGathering ? "#0CA678" : undefined}
        logoSrc={
          isLocalGathering ? "/gatherings/local%20gat%20logo.png" : undefined
        }
      />
      {!isLocalGathering && <MovingPartyBackground />}

      <main className="flex-grow pt-16 pb-20 md:pb-0">
        {/* Event Banner */}
        <div className="w-full h-[50vh] md:h-[60vh] relative overflow-hidden">
          {event.images && event.images.length > 0 ? (
            <Swiper
              modules={[Navigation, Pagination]}
              navigation
              pagination={{ clickable: true }}
              className="w-full h-full"
              style={{ height: "100%" }}
            >
              {event.images.map((img, idx) => (
                <SwiperSlide key={img}>
                  <img
                    src={img}
                    alt={`${event.title} image ${idx + 1}`}
                    className="w-full h-full object-cover object-center bg-black"
                    style={{ height: "100%" }}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <img
              src={event.image}
              alt={event.title}
              className="w-full h-full object-cover object-center bg-black"
            />
          )}
        </div>

        <div className="container-padding mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Event Details */}
            <div className="lg:col-span-2">
              <FadeIn>
                <Badge
                  className={`mb-4 ${
                    isLocalGathering
                      ? "bg-[#F7E1B5] text-[#0CA678] hover:bg-[#e6d7a8]"
                      : "bg-violet hover:bg-violet-700"
                  }`}
                >
                  {event.category}
                </Badge>
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <Badge
                    className={`${statusInfo.bgColor} ${statusInfo.color} border-0`}
                  >
                    {statusInfo.text}
                  </Badge>
                  {event.is_private && (
                    <Badge
                      className="bg-purple-100 text-purple-800 hover:bg-purple-200 border-0 flex items-center gap-1"
                    >
                      <Lock className="h-3 w-3" />
                      Invite Only
                    </Badge>
                  )}
                  {isCompleted && (
                    <Badge
                      variant="outline"
                      className="text-gray-600 border-gray-300"
                    >
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Booking Closed
                    </Badge>
                  )}
                </div>
                <h1
                  className={`text-3xl md:text-4xl font-bold mb-2 ${
                    isLocalGathering ? "text-mapcream" : ""
                  }`}
                >
                  {event.title}
                </h1>
                <h2
                  className={`text-xl mb-6 ${
                    isLocalGathering ? "text-mapcream" : "text-muted-foreground"
                  }`}
                >
                  {event.subtitle}
                </h2>

                {/* --- ENHANCED INTERACTIVE DESCRIPTION SECTION --- */}
                <div className="mt-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-8 bg-gradient-to-b from-primary to-primary/70 rounded-full"></div>
                    <h3
                      className={`text-3xl font-bold ${
                        isLocalGathering ? "text-mapcream" : "text-foreground"
                      }`}
                    >
                      About The Event
                    </h3>
                  </div>
                  
                  <div
                    className="relative overflow-hidden transition-all duration-500 ease-in-out"
                    style={{
                      background: "linear-gradient(135deg, #FFF9C4 0%, #FFF8E1 100%)",
                      borderRadius: "16px",
                      padding: "24px 28px",
                      marginTop: 8,
                      marginBottom: 8,
                      color: "#111",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                    }}
                  >
                    {/* Decorative elements */}
                    <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-yellow-200/30 to-yellow-300/30 rounded-full"></div>
                    <div className="absolute bottom-4 left-4 w-6 h-6 bg-gradient-to-br from-yellow-300/20 to-yellow-400/20 rounded-full"></div>
                    
                    <div
                      className={`max-w-none leading-relaxed transition-all duration-300 ${
                        shouldTruncate && !isDescriptionExpanded 
                          ? "text-base" 
                          : "text-lg"
                      }`}
                      style={{ 
                        color: "#111",
                        lineHeight: "1.8",
                        letterSpacing: "0.01em"
                      }}
                    >
                      {shouldTruncate && !isDescriptionExpanded ? (
                        <div className="space-y-4">
                          {renderFormattedDescription(fullDescription.substring(0, TRUNCATE_LENGTH))}
                          <span className="text-amber-700 font-medium">...</span>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {renderFormattedDescription(fullDescription)}
                        </div>
                      )}
                    </div>
                    
                    {shouldTruncate && (
                      <div className="mt-6 flex justify-center">
                        <button
                          onClick={() =>
                            setIsDescriptionExpanded(!isDescriptionExpanded)
                          }
                          className={`
                            group relative overflow-hidden px-8 py-3 rounded-xl font-semibold
                            transition-all duration-300 ease-out transform hover:scale-105
                            focus:outline-none focus:ring-4 focus:ring-opacity-50
                            ${isLocalGathering 
                              ? "bg-gradient-to-r from-[#0CA678] to-[#059669] text-white hover:from-[#059669] hover:to-[#047857] focus:ring-[#0CA678]" 
                              : "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary/80 focus:ring-primary"
                            }
                            shadow-lg hover:shadow-xl
                          `}
                          style={{
                            boxShadow: "0 4px 15px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)",
                          }}
                        >
                          <span className="relative z-10 flex items-center gap-2">
                            {isDescriptionExpanded ? (
                              <>
                                <svg className="w-4 h-4 transition-transform duration-300 group-hover:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                                Show Less
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                                Read More
                              </>
                            )}
                          </span>
                          
                          {/* Animated background effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* --- ADDED: Event Offers in Main Description --- */}
                  {event.offers && event.offers.length > 0 && (
                    <div className="mt-8">
                      <h3
                        className={`text-2xl font-bold mb-3 ${
                          isLocalGathering ? "text-mapcream" : ""
                        }`}
                      >
                        Special Offers & Deals
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {event.offers.map((offer: any, idx: number) => (
                          <div
                            key={idx}
                            className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-semibold text-green-800 text-lg">
                                {offer.title}
                              </div>
                              <Badge
                                variant="outline"
                                className="text-xs bg-green-100 text-green-700 border-green-300"
                              >
                                {offer.offer_type === 'flat_rate' ? 'Flat Rate' : 
                                 offer.offer_type === 'add_person' ? 'Add Person' :
                                 offer.offer_type === 'group_discount' ? 'Group Discount' :
                                 offer.offer_type === 'student_discount' ? 'Student' :
                                 offer.offer_type === 'women_flash_sale' ? 'Women Special' :
                                 offer.offer_type === 'no_stag' ? 'No STAG' :
                                 offer.offer_type === 'razorpay_above' ? 'Payment Fee' : 'Special'}
                              </Badge>
                            </div>
                            {offer.description && (
                              <div className="text-sm text-gray-700 mb-3">
                                {offer.description}
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-green-600 font-bold text-lg">
                                {offer.offer_type === 'flat_rate' ? `₹${offer.price_adjustment}` :
                                 offer.price_adjustment > 0 ? `+₹${offer.price_adjustment}` :
                                 `-₹${Math.abs(offer.price_adjustment)}`}
                              </span>
                              <div className="text-right text-sm text-gray-600">
                                <div>Min: {offer.min_quantity}</div>
                                {offer.max_quantity && <div>Max: {offer.max_quantity}</div>}
                                <div>Group: {offer.group_size}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </FadeIn>
            </div>

            {/* Booking Card */}
            <div className="lg:col-span-1">
              <FadeIn delay={400}>
                <div className="sticky top-24">
                  <Card
                    className={`border-none shadow-soft overflow-hidden ${
                      isLocalGathering ? "bg-[#F7E1B5]" : ""
                    }`}
                    style={!isLocalGathering ? { background: "#FFF9C4" } : {}}
                  >
                    <CardContent
                      className="p-6"
                      style={!isLocalGathering ? { color: "#222" } : {}}
                    >
                      <h3
                        className={`text-xl font-bold mb-4 ${
                          isLocalGathering ? "text-[#0CA678]" : "text-black"
                        }`}
                      >
                        Event Details
                      </h3>
                      <div className="space-y-4 mb-6">
                        {/* Event details items like Venue, Date, Time, etc. */}
                        <div className="flex items-start">
                          <MapPin
                            className={`h-5 w-5 mr-3 mt-0.5 ${
                              isLocalGathering
                                ? "text-[#0CA678]"
                                : "text-raspberry"
                            }`}
                          />
                          <div>
                            <div
                              className={`font-semibold ${
                                isLocalGathering
                                  ? "text-[#0CA678]"
                                  : "text-black"
                              }`}
                            >
                              Venue
                            </div>
                            <div
                              className={
                                isLocalGathering
                                  ? "text-[#0CA678]"
                                  : "text-black"
                              }
                            >
                              {event.venue}, {event.city}
                            </div>

                            {/* --- ADDED: Google Maps Iframe Embed --- */}
                            <div className="mt-4 w-full h-48 rounded-lg overflow-hidden border border-gray-300">
                              <iframe
                                src={`https://maps.google.com/maps?q=${encodeURIComponent(
                                  `${event.venue}, ${event.city}`
                                )}&output=embed`}
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Event Location Map"
                              />
                            </div>

                            {event.location_map_link && (
                              <a
                                href={event.location_map_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-block mt-2 px-3 py-1 rounded-md text-sm font-medium ${
                                  isLocalGathering
                                    ? "bg-[#0CA678] text-white hover:bg-[#08996c]"
                                    : "bg-violet text-white hover:bg-violet-700"
                                }`}
                                style={{ textDecoration: "none" }}
                              >
                                View on Google Maps
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex items-start">
                          <Calendar
                            className={`h-5 w-5 mr-3 mt-0.5 ${
                              isLocalGathering
                                ? "text-[#0CA678]"
                                : "text-violet"
                            }`}
                          />
                          <div>
                            <div
                              className={`font-semibold ${
                                isLocalGathering
                                  ? "text-[#0CA678]"
                                  : "text-black"
                              }`}
                            >
                              Date
                            </div>
                            <div
                              className={
                                isLocalGathering
                                  ? "text-[#0CA678]"
                                  : "text-black"
                              }
                            >
                              {formatDate(event.date)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <Clock
                            className={`h-5 w-5 mr-3 mt-0.5 ${
                              isLocalGathering
                                ? "text-[#0CA678]"
                                : "text-yellow"
                            }`}
                          />
                          <div>
                            <div
                              className={`font-semibold ${
                                isLocalGathering
                                  ? "text-[#0CA678]"
                                  : "text-black"
                              }`}
                            >
                              Time & Duration
                            </div>
                            <div
                              className={
                                isLocalGathering
                                  ? "text-[#0CA678]"
                                  : "text-black"
                              }
                            >
                              {event.time} • {event.duration || "TBD"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <User
                            className={`h-5 w-5 mr-3 mt-0.5 ${
                              isLocalGathering
                                ? "text-[#0CA678]"
                                : "text-green-500"
                            }`}
                          />
                          <div>
                            <div
                              className={`font-semibold ${
                                isLocalGathering
                                  ? "text-[#0CA678]"
                                  : "text-black"
                              }`}
                            >
                              Host
                            </div>
                            <div
                              className={
                                isLocalGathering
                                  ? "text-[#0CA678]"
                                  : "text-black"
                              }
                            >
                              {event.host || "Motojojo"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <Tag
                            className={`h-5 w-5 mr-3 mt-0.5 ${
                              isLocalGathering
                                ? "text-[#0CA678]"
                                : "text-blue-500"
                            }`}
                          />
                          <div>
                            <div
                              className={`font-semibold ${
                                isLocalGathering
                                  ? "text-[#0CA678]"
                                  : "text-black"
                              }`}
                            >
                              Category
                            </div>
                            <div
                              className={
                                isLocalGathering
                                  ? "text-[#0CA678]"
                                  : "text-black"
                              }
                            >
                              {event.category}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <DollarSign
                            className={`h-5 w-5 mr-3 mt-0.5 ${
                              isLocalGathering
                                ? "text-[#0CA678]"
                                : "text-purple-500"
                            }`}
                          />
                          <div>
                            <div
                              className={`font-semibold ${
                                isLocalGathering
                                  ? "text-[#0CA678]"
                                  : "text-black"
                              }`}
                            >
                              Price
                            </div>
                            {event.has_discount &&
                            event.real_price &&
                            event.discounted_price ? (
                              <div className="flex flex-col items-start">
                                <span
                                  className={`text-base opacity-60 line-through decoration-2 decoration-red-500 ${
                                    isLocalGathering
                                      ? "text-[#0CA678]"
                                      : "text-black"
                                  }`}
                                >
                                  ₹{formatPrice(event.real_price)}
                                </span>
                                <span className="text-xl font-bold text-red-600">
                                  ₹{formatPrice(event.discounted_price)}
                                </span>
                              </div>
                            ) : (
                              <div
                                className={`text-xl font-bold ${
                                  isLocalGathering
                                    ? "text-[#0CA678]"
                                    : "text-black"
                                }`}
                              >
                                ₹{formatPrice(event.price)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* --- ADDED: Event Offers Section --- */}
                        {event.offers && event.offers.length > 0 && (
                          <div className="flex items-start">
                            <DollarSign
                              className={`h-5 w-5 mr-3 mt-0.5 ${
                                isLocalGathering
                                  ? "text-[#0CA678]"
                                  : "text-green-600"
                              }`}
                            />
                            <div className="w-full">
                              <div
                                className={`font-semibold ${
                                  isLocalGathering
                                    ? "text-[#0CA678]"
                                    : "text-black"
                                }`}
                              >
                                Special Offers
                              </div>
                              <div className="space-y-2 mt-2">
                                {event.offers.map((offer: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="bg-green-50 border border-green-200 rounded-lg p-3"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="font-medium text-green-800">
                                        {offer.title}
                                      </div>
                                      <Badge
                                        variant="outline"
                                        className="text-xs bg-green-100 text-green-700 border-green-300"
                                      >
                                        {offer.offer_type === 'flat_rate' ? 'Flat Rate' : 
                                         offer.offer_type === 'add_person' ? 'Add Person' :
                                         offer.offer_type === 'group_discount' ? 'Group Discount' :
                                         offer.offer_type === 'student_discount' ? 'Student' :
                                         offer.offer_type === 'women_flash_sale' ? 'Women Special' :
                                         offer.offer_type === 'no_stag' ? 'No STAG' :
                                         offer.offer_type === 'razorpay_above' ? 'Payment Fee' : 'Special'}
                                      </Badge>
                                    </div>
                                    {offer.description && (
                                      <div className="text-sm text-green-700 mt-1">
                                        {offer.description}
                                      </div>
                                    )}
                                    <div className="flex items-center justify-between mt-2 text-sm">
                                      <span className="text-green-600 font-medium">
                                        {offer.offer_type === 'flat_rate' ? `₹${offer.price_adjustment}` :
                                         offer.price_adjustment > 0 ? `+₹${offer.price_adjustment}` :
                                         `-₹${Math.abs(offer.price_adjustment)}`}
                                      </span>
                                      <span className="text-gray-600">
                                        Min: {offer.min_quantity}
                                        {offer.max_quantity && ` • Max: ${offer.max_quantity}`}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>

                    {/* --- ADDED: Countdown Timer UI --- */}
                    {!isCompleted && (
                      <div className="px-6 pb-4">
                        <div className="flex items-center justify-around text-sm p-3 bg-red-50 rounded-lg">
                          <div className="text-center">
                            <div className="text-xl font-bold text-red-600">
                              {countdown.days}
                            </div>
                            <div className="text-red-500 text-xs uppercase">
                              Days
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold text-red-600">
                              {countdown.hours}
                            </div>
                            <div className="text-red-500 text-xs uppercase">
                              Hours
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold text-red-600">
                              {countdown.minutes}
                            </div>
                            <div className="text-red-500 text-xs uppercase">
                              Minutes
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold text-red-600">
                              {countdown.seconds}
                            </div>
                            <div className="text-red-500 text-xs uppercase">
                              Seconds
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <CardFooter className="px-6 pb-6 pt-0">
                      {isCompleted ? (
                        <div className="w-full text-center">
                          <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <h3 className="text-lg font-semibold text-gray-700 mb-1">
                              Event Has Ended
                            </h3>
                            <p className="text-sm text-gray-600">
                              This event took place on {formatDate(event.date)}.
                              Thank you to everyone who attended!
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => navigate("/events")}
                          >
                            Browse Other Events
                          </Button>
                        </div>
                      ) : (
                        <div className="w-full space-y-3">
                          {event.is_private ? (
                            myInviteStatus === "accepted" ? (
                              <Button
                                className={
                                  isLocalGathering
                                    ? "w-full bg-[#0CA678] hover:bg-[#0a8a6a] text-white"
                                    : "w-full"
                                }
                                onClick={() => {
                                  if (isSignedIn) {
                                    navigate(`/book/${event.id}`);
                                  } else {
                                    navigate(
                                      `/auth?redirect=/book/${event.id}`
                                    );
                                  }
                                }}
                                size="lg"
                              >
                                Book Now
                              </Button>
                            ) : (
                              <Button
                                className={
                                  isLocalGathering
                                    ? "w-full bg-[#0CA678] hover:bg-[#0a8a6a] text-white"
                                    : "w-full"
                                }
                                onClick={handleRequestToJoin}
                                size="lg"
                                disabled={myInviteStatus === "pending"}
                              >
                                {myInviteStatus === "pending"
                                  ? "Pending Approval"
                                  : "Request to Join"}
                              </Button>
                            )
                          ) : (
                            <Button
                              className={
                                isLocalGathering
                                  ? "w-full bg-[#0CA678] hover:bg-[#0a8a6a] text-white"
                                  : "w-full"
                              }
                              onClick={() => {
                                if (isSignedIn) {
                                  navigate(`/book/${event.id}`);
                                } else {
                                  navigate(`/auth?redirect=/book/${event.id}`);
                                }
                              }}
                              size="lg"
                            >
                              Book Now
                            </Button>
                          )}
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                </div>
              </FadeIn>
            </div>
          </div>

          {/* Testimonials Section */}
          <TestimonialsSection greenTheme />

          {/* Similar Events */}
          {!similarEventsLoading && similarEvents.length > 0 && (
            <FadeIn delay={500}>
              <h3
                className={`text-2xl font-bold mt-12 mb-6 ${
                  isLocalGathering ? "text-mapcream" : ""
                }`}
              >
                Similar Events
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                {similarEvents.map((event: Event) => (
                  <Card
                    key={event.id}
                    className={`hover-scale border-none shadow-soft overflow-hidden ${
                      isLocalGathering ? "bg-[#0CA678]" : ""
                    }`}
                  >
                    <div className="h-48 relative">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3">
                        <Badge
                          className={
                            isLocalGathering
                              ? "bg-[#F7E1B5] text-[#0CA678] hover:bg-[#e6d7a8]"
                              : "bg-violet hover:bg-violet-700"
                          }
                        >
                          {event.category}
                        </Badge>
                      </div>
                    </div>
                    <CardContent
                      className={`p-5 ${
                        isLocalGathering ? "text-mapcream" : "text-black"
                      }`}
                    >
                      <h3
                        className={`text-lg font-bold mb-1 ${
                          isLocalGathering ? "text-mapcream" : ""
                        }`}
                      >
                        {event.title}
                      </h3>
                      <p
                        className={`text-sm mb-4 line-clamp-2 ${
                          isLocalGathering ? "text-mapcream" : ""
                        }`}
                      >
                        {event.subtitle}
                      </p>

                      <div
                        className={`flex items-center gap-2 text-sm mb-2 ${
                          isLocalGathering ? "text-mapcream" : ""
                        }`}
                      >
                        <MapPin
                          className={`h-4 w-4 ${
                            isLocalGathering ? "text-mapcream" : ""
                          }`}
                        />
                        <span
                          className={isLocalGathering ? "text-mapcream" : ""}
                        >
                          {event.city}
                        </span>
                      </div>
                      <div
                        className={`flex items-center gap-2 text-sm ${
                          isLocalGathering ? "text-mapcream" : ""
                        }`}
                      >
                        <Calendar
                          className={`h-4 w-4 ${
                            isLocalGathering ? "text-mapcream" : ""
                          }`}
                        />
                        <span
                          className={isLocalGathering ? "text-mapcream" : ""}
                        >
                          {formatDate(event.date)}
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter
                      className={`px-5 pb-5 pt-0 flex justify-between items-center ${
                        isLocalGathering ? "text-mapcream" : "text-black"
                      }`}
                    >
                      <div
                        className={`text-lg font-bold ${
                          isLocalGathering ? "text-mapcream" : ""
                        }`}
                      >
                        ₹{formatPrice(event.price)}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(getEventUrl(event))}
                          className={
                            isLocalGathering
                              ? "bg-[#F7E1B5] text-[#0CA678] border-[#0CA678] hover:bg-[#e6d7a8]"
                              : ""
                          }
                        >
                          View Details
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </FadeIn>
          )}
        </div>
      </main>

      {/* Mobile Bottom Bar */}
      {event && !isCompleted && (
        <div
          className="fixed bottom-4 left-2 right-2 z-50 md:hidden"
          style={{
            background: "#fcdfc0",
            border: "1px solid #f3e1e1",
            borderRadius: "1rem",
            boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
          }}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              {event.has_discount &&
              event.real_price &&
              event.discounted_price ? (
                <>
                  <div className="text-lg font-semibold text-pink-500 line-through mb-0.5">
                    ₹{formatPrice(event.real_price)}
                  </div>
                  <div className="text-2xl font-bold text-pink-600 mb-0.5">
                    ₹{formatPrice(event.discounted_price)}
                  </div>
                </>
              ) : (
                <div className="text-2xl font-bold text-pink-600 mb-0.5">
                  ₹{formatPrice(event.price)}
                </div>
              )}
              <div className="text-base text-gray-500 font-medium mt-1">
                per ticket
              </div>
              <div className="w-14 h-1 bg-gray-100 rounded-full mt-2 mb-1" />
            </div>
            {event.is_private ? (
              myInviteStatus === "accepted" ? (
                <Button
                  className="ml-4 px-8 py-3 text-base rounded-full bg-pink-600 hover:bg-pink-700 text-white font-bold shadow-md transition-colors duration-150"
                  style={{ boxShadow: "0 2px 8px rgba(255, 56, 92, 0.15)" }}
                  onClick={() => {
                    if (isSignedIn) {
                      navigate(`/book/${event.id}`);
                    } else {
                      navigate(`/auth?redirect=/book/${event.id}`);
                    }
                  }}
                >
                  Book Now
                </Button>
              ) : (
                <Button
                  className="ml-4 px-8 py-3 text-base rounded-full bg-pink-600 hover:bg-pink-700 text-white font-bold shadow-md transition-colors duration-150"
                  style={{ boxShadow: "0 2px 8px rgba(255, 56, 92, 0.15)" }}
                  onClick={handleRequestToJoin}
                  disabled={myInviteStatus === "pending"}
                >
                  {myInviteStatus === "pending"
                    ? "Pending Approval"
                    : "Request to Join"}
                </Button>
              )
            ) : (
              <Button
                className="ml-4 px-8 py-3 text-base rounded-full bg-pink-600 hover:bg-pink-700 text-white font-bold shadow-md transition-colors duration-150"
                style={{ boxShadow: "0 2px 8px rgba(255, 56, 92, 0.15)" }}
                onClick={() => {
                  if (isSignedIn) {
                    navigate(`/book/${event.id}`);
                  } else {
                    navigate(`/auth?redirect=/book/${event.id}`);
                  }
                }}
              >
                Book Now
              </Button>
            )}
          </div>
        </div>
      )}

      {isLocalGathering ? (
        <div style={{ backgroundColor: "#0CA678" }}>
          <Footer />
        </div>
      ) : (
        <Footer />
      )}
    </div>
  );
};

export default EventDetail;
