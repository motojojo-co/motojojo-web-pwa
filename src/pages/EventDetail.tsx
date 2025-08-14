import React from 'react';
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";
import { 
  Card, 
  CardContent, 
  CardFooter 
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
} from "lucide-react";
import { getEvent, getEventsByCategory, Event } from "@/services/eventService";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getEventStatus, formatEventStatus } from "@/lib/utils";
import MovingPartyBackground from "@/components/ui/MovingPartyBackground";
import { getEventTypes } from "@/services/eventTypeService";
import { useAuth } from "@/hooks/use-auth";
import TestimonialsSection from "@/components/home/TestimonialsSection";
// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [isLocalGathering, setIsLocalGathering] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const { isSignedIn } = useAuth();
  
  // Fetch event details
  const { 
    data: event, 
    isLoading: eventLoading, 
    error: eventError 
  } = useQuery({
    queryKey: ['event', id],
    queryFn: () => getEvent(id || ''),
    enabled: !!id
  });
  
  // Fetch similar events
  const { 
    data: similarEvents = [], 
    isLoading: similarEventsLoading 
  } = useQuery({
    queryKey: ['similarEvents', event?.category],
    queryFn: () => getEventsByCategory(event?.category || ''),
    enabled: !!event?.category,
    select: (data) => data.filter(e => e.id !== event?.id).slice(0, 3)
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
      setIsLocalGathering(localGatheringType && event.event_type === localGatheringType.id);
    }
  }, [event, eventTypes]);

  // Countdown timer effect
  useEffect(() => {
    if (!event?.date) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const eventTime = new Date(event.date).getTime();
      const distance = eventTime - now;

      if (distance > 0) {
        setCountdown({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      } else {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [event?.date]);

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const formatPrice = (price: number): string => {
    return price.toLocaleString('en-IN');
  };
  
  // Get event status
  const eventStatus = event ? getEventStatus(event.date, event.time) : 'upcoming';
  const statusInfo = formatEventStatus(eventStatus);
  const isCompleted = eventStatus === 'completed';
  
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
            <p className="text-muted-foreground">The event you're looking for doesn't exist or has been removed.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  
  // Logic for collapsible description
  const fullDescription = `${event.description}\n\n${event.long_description || ''}`.trim();
  const TRUNCATE_LENGTH = 350;
  const shouldTruncate = fullDescription.length > TRUNCATE_LENGTH;
  
  // Mock data for FAQ and reviews until they are added to the database
  const faq = [
    { question: "What should I bring?", answer: "Just yourself and a valid ID. If you have a printed ticket, please bring it along." },
    { question: "Is there parking available?", answer: "Yes, there is ample parking available at the venue." },
    { question: "Can I get a refund if I can't attend?", answer: "Refunds are available up to 48 hours before the event. Please contact our support team." }
  ];

  return (
    <div className={`min-h-screen flex flex-col ${isLocalGathering ? '' : ''}`} style={isLocalGathering ? { backgroundColor: '#0CA678' } : {}}>
      <Navbar 
        selectedCity={selectedCity} 
        setSelectedCity={setSelectedCity} 
        bgColor={isLocalGathering ? "#0CA678" : undefined}
        logoSrc={isLocalGathering ? "/gatherings/local%20gat%20logo.png" : undefined}
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
              style={{ height: '100%' }}
            >
              {event.images.map((img, idx) => (
                <SwiperSlide key={img}>
                  <img
                    src={img}
                    alt={`${event.title} image ${idx + 1}`}
                    className="w-full h-full object-cover object-center bg-black"
                    style={{ height: '100%' }}
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
                <Badge className={`mb-4 ${isLocalGathering ? 'bg-[#F7E1B5] text-[#0CA678] hover:bg-[#e6d7a8]' : 'bg-violet hover:bg-violet-700'}`}>{event.category}</Badge>
                <div className="flex items-center gap-2 mb-4">
                  <Badge className={`${statusInfo.bgColor} ${statusInfo.color} border-0`}>
                    {statusInfo.text}
                  </Badge>
                  {isCompleted && (
                    <Badge variant="outline" className="text-gray-600 border-gray-300">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Booking Closed
                    </Badge>
                  )}
                </div>
                <h1 className={`text-3xl md:text-4xl font-bold mb-2 ${isLocalGathering ? 'text-mapcream' : ''}`}>{event.title}</h1>
                <h2 className={`text-xl mb-6 ${isLocalGathering ? 'text-mapcream' : 'text-muted-foreground'}`}>{event.subtitle}</h2>
                
                {/* --- IMPROVED DESCRIPTION SECTION --- */}
                <div className="mt-8">
                  <h3 className={`text-2xl font-bold mb-3 ${isLocalGathering ? 'text-mapcream' : ''}`}>About The Event</h3>
                  <div style={{ background: '#FFF9C4', borderRadius: '12px', padding: '18px 20px', marginTop: 8, marginBottom: 8, color: '#111' }}>
  <div className="whitespace-pre-line max-w-none text-base leading-relaxed" style={{ color: '#111' }} >
                    {shouldTruncate && !isDescriptionExpanded
                      ? `${fullDescription.substring(0, TRUNCATE_LENGTH)}...`
                      : fullDescription
                    }
                  </div>
                  {shouldTruncate && (
    <button
      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
      style={{
        background: '#FFF176',
        color: '#222',
        fontWeight: 'bold',
        border: 'none',
        borderRadius: '8px',
        padding: '8px 20px',
        marginTop: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        cursor: 'pointer',
        transition: 'background 0.2s',
      }}
      className={isLocalGathering ? 'hover:bg-[#0CA678] hover:text-white' : ''}
    >
      {isDescriptionExpanded ? 'Show Less' : 'Read More'}
    </button>
  )}
  </div>
                </div>
              </FadeIn>

              {/* FAQ Section (Commented Out)
              <FadeIn delay={300}>
                <h3 className="text-2xl font-bold mb-4 mt-12">Frequently Asked Questions</h3>
                <Accordion type="single" collapsible className="mb-12">
                  {faq.map((item, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left font-medium">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </FadeIn> */}
            </div>
            
            {/* Booking Card */}
            <div className="lg:col-span-1">
              <FadeIn delay={400}>
                <div className="sticky top-24">
                  <Card className={`border-none shadow-soft overflow-hidden ${isLocalGathering ? 'bg-[#F7E1B5]' : ''}`} style={!isLocalGathering ? { background: '#FFF9C4' } : {}}>
                    <CardContent className="p-6" style={!isLocalGathering ? { color: '#222' } : {}} >
                      <h3 className={`text-xl font-bold mb-4 ${isLocalGathering ? 'text-[#0CA678]' : 'text-black'}`}>Event Details</h3>
                      <div className="space-y-4 mb-6">
                        {/* Event details items like Venue, Date, Time, etc. */}
                        <div className="flex items-start">
                          <MapPin className={`h-5 w-5 mr-3 mt-0.5 ${isLocalGathering ? 'text-[#0CA678]' : 'text-raspberry'}`} />
                          <div>
                            <div className={`font-semibold ${isLocalGathering ? 'text-[#0CA678]' : 'text-black'}`}>Venue</div>
                            <div className={isLocalGathering ? 'text-[#0CA678]' : 'text-black'}>{event.venue}, {event.city}</div>


                            {/* Inline Map */}
                            <div className="mt-4 w-full h-64 rounded-lg overflow-hidden border">
                              <iframe
                                src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(`${event.venue}, ${event.city}`)}`}
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Event Location Map"
                              />
                            </div>
                            
                            {/* Open in Google Maps Button */}
                            {event.location_map_link && (
                              <a
                                href={event.location_map_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-block mt-3 px-4 py-2 rounded-md text-sm font-medium ${isLocalGathering ? 'bg-[#0CA678] text-white hover:bg-[#08996c]' : 'bg-violet text-white hover:bg-violet-700'}`}
                                style={{ textDecoration: 'none' }}
                              >
                                Open in Google Maps
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex items-start">
                          <Calendar className={`h-5 w-5 mr-3 mt-0.5 ${isLocalGathering ? 'text-[#0CA678]' : 'text-violet'}`} />
                          <div>
                            <div className={`font-semibold ${isLocalGathering ? 'text-[#0CA678]' : 'text-black'}`}>Date</div>
                            <div className={isLocalGathering ? 'text-[#0CA678]' : 'text-black'}>{formatDate(event.date)}</div>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <Clock className={`h-5 w-5 mr-3 mt-0.5 ${isLocalGathering ? 'text-[#0CA678]' : 'text-yellow'}`} />
                          <div>
                            <div className={`font-semibold ${isLocalGathering ? 'text-[#0CA678]' : 'text-black'}`}>Time & Duration</div>
                            <div className={isLocalGathering ? 'text-[#0CA678]' : 'text-black'}>{event.time} • {event.duration || 'TBD'}</div>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <User className={`h-5 w-5 mr-3 mt-0.5 ${isLocalGathering ? 'text-[#0CA678]' : 'text-green-500'}`} />
                          <div>
                            <div className={`font-semibold ${isLocalGathering ? 'text-[#0CA678]' : 'text-black'}`}>Host</div>
                            <div className={isLocalGathering ? 'text-[#0CA678]' : 'text-black'}>{event.host || 'Motojojo'}</div>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <Tag className={`h-5 w-5 mr-3 mt-0.5 ${isLocalGathering ? 'text-[#0CA678]' : 'text-blue-500'}`} />
                          <div>
                            <div className={`font-semibold ${isLocalGathering ? 'text-[#0CA678]' : 'text-black'}`}>Category</div>
                            <div className={isLocalGathering ? 'text-[#0CA678]' : 'text-black'}>{event.category}</div>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <DollarSign className={`h-5 w-5 mr-3 mt-0.5 ${isLocalGathering ? 'text-[#0CA678]' : 'text-purple-500'}`} />
                          <div>
                            <div className={`font-semibold ${isLocalGathering ? 'text-[#0CA678]' : 'text-black'}`}>Price</div>
                            {event.has_discount && event.real_price && event.discounted_price ? (
                              <div className="flex flex-col items-start">
                                <span className={`text-base opacity-60 line-through decoration-2 decoration-red-500 ${isLocalGathering ? 'text-[#0CA678]' : 'text-black'}`}>₹{formatPrice(event.real_price)}</span>
                                <span className="text-xl font-bold text-red-600">₹{formatPrice(event.discounted_price)}</span>
                              </div>
                            ) : (
                              <div className={`text-xl font-bold ${isLocalGathering ? 'text-[#0CA678]' : 'text-black'}`}>₹{formatPrice(event.price)}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    
                    {/* Countdown Timer */}
                    {!isCompleted && (
                      <div className="px-6 pb-4">
                        <div className="flex items-center justify-center space-x-6 text-sm">
                          <div className="text-center">
                            <div className="text-lg font-bold text-red-600">
                              {countdown.days}
                            </div>
                            <div className="text-red-500 text-xs">Days</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-red-600">
                              {countdown.hours}
                            </div>
                            <div className="text-red-500 text-xs">Hours</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-red-600">
                              {countdown.minutes}
                            </div>
                            <div className="text-red-500 text-xs">Minutes</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-red-600">
                              {countdown.seconds}
                            </div>
                            <div className="text-red-500 text-xs">Seconds</div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <CardFooter className="px-6 pb-6 pt-0">
                      {isCompleted ? (
                        <div className="w-full text-center">
                          <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <h3 className="text-lg font-semibold text-gray-700 mb-1">Event Has Ended</h3>
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
                          <Button 
                            className={isLocalGathering ? 'w-full bg-[#0CA678] hover:bg-[#0a8a6a] text-white' : 'w-full'}
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
              <h3 className={`text-2xl font-bold mt-12 mb-6 ${isLocalGathering ? 'text-mapcream' : ''}`}>Similar Events</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                {similarEvents.map((event: Event) => (
                  <Card key={event.id} className={`hover-scale border-none shadow-soft overflow-hidden ${isLocalGathering ? 'bg-[#0CA678]' : ''}`}>
                    <div className="h-48 relative">
                      <img 
                        src={event.image} 
                        alt={event.title} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3">
                        <Badge className={isLocalGathering ? 'bg-[#F7E1B5] text-[#0CA678] hover:bg-[#e6d7a8]' : 'bg-violet hover:bg-violet-700'}>{event.category}</Badge>
                      </div>
                    </div>
                    <CardContent className={`p-5 ${isLocalGathering ? 'text-mapcream' : 'text-black'}`}>
                      <h3 className={`text-lg font-bold mb-1 ${isLocalGathering ? 'text-mapcream' : ''}`}>{event.title}</h3>
                      <p className={`text-sm mb-4 line-clamp-2 ${isLocalGathering ? 'text-mapcream' : ''}`}>{event.subtitle}</p>
                      
                      <div className={`flex items-center gap-2 text-sm mb-2 ${isLocalGathering ? 'text-mapcream' : ''}`}>
                        <MapPin className={`h-4 w-4 ${isLocalGathering ? 'text-mapcream' : ''}`} />
                        <span className={isLocalGathering ? 'text-mapcream' : ''}>{event.city}</span>
                      </div>
                      <div className={`flex items-center gap-2 text-sm ${isLocalGathering ? 'text-mapcream' : ''}`}>
                        <Calendar className={`h-4 w-4 ${isLocalGathering ? 'text-mapcream' : ''}`} />
                        <span className={isLocalGathering ? 'text-mapcream' : ''}>{formatDate(event.date)}</span>
                      </div>
                    </CardContent>
                    <CardFooter className={`px-5 pb-5 pt-0 flex justify-between items-center ${isLocalGathering ? 'text-mapcream' : 'text-black'}`}>
                      <div className={`text-lg font-bold ${isLocalGathering ? 'text-mapcream' : ''}`}>₹{formatPrice(event.price)}</div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/event/${event.id}`)}
                          className={isLocalGathering ? 'bg-[#F7E1B5] text-[#0CA678] border-[#0CA678] hover:bg-[#e6d7a8]' : ''}
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
        <div className="fixed bottom-4 left-2 right-2 z-50 md:hidden" style={{ background: '#fcdfc0', border: '1px solid #f3e1e1', borderRadius: '1rem', boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}>
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              {event.has_discount && event.real_price && event.discounted_price ? (
                <>
                  <div className="text-lg font-semibold text-pink-500 line-through mb-0.5">₹{formatPrice(event.real_price)}</div>
                  <div className="text-2xl font-bold text-pink-600 mb-0.5">₹{formatPrice(event.discounted_price)}</div>
                </>
              ) : (
                <div className="text-2xl font-bold text-pink-600 mb-0.5">₹{formatPrice(event.price)}</div>
              )}
              <div className="text-base text-gray-500 font-medium mt-1">per ticket</div>
              <div className="w-14 h-1 bg-gray-100 rounded-full mt-2 mb-1" />
            </div>
            <Button
              className="ml-4 px-8 py-3 text-base rounded-full bg-pink-600 hover:bg-pink-700 text-white font-bold shadow-md transition-colors duration-150"
              style={{ boxShadow: '0 2px 8px rgba(255, 56, 92, 0.15)' }}
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
          </div>
        </div>
      )}
      
      {isLocalGathering ? (
        <div style={{ backgroundColor: '#0CA678' }}>
          <Footer />
        </div>
      ) : (
        <Footer />
      )}
    </div>
  );
};

export default EventDetail;
