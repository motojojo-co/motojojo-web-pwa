import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getEventTypes } from "@/services/eventTypeService";
import { getEvents } from "@/services/eventService";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getEventUrl } from "@/lib/eventUtils";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";

function isEventOver(date: string, time: string) {
  const eventDate = new Date(`${date}T${time}`);
  return eventDate < new Date();
}

const PardahGathering = () => {
  const navigate = useNavigate();
  const [eventTypeId, setEventTypeId] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>("");

  // Fetch event types to get the ID for 'Pardah Gathering'
  const { data: eventTypes = [], isLoading: loadingTypes } = useQuery({
    queryKey: ["event-types"],
    queryFn: getEventTypes,
  });

  useEffect(() => {
    if (eventTypes.length > 0) {
      const pardah = eventTypes.find(
        (et) => et.name.toLowerCase() === "pardah gathering"
      );
      setEventTypeId(pardah?.id || null);
    }
  }, [eventTypes]);

  // Fetch events for this event type
  const {
    data: events = [],
    isLoading: loadingEvents,
    isFetching: fetchingEvents,
  } = useQuery({
    queryKey: ["pardah-gathering-events", eventTypeId],
    queryFn: () => (eventTypeId ? getEvents({ eventType: eventTypeId, city: selectedCity }) : []),
    enabled: !!eventTypeId,
  });

  // Only show upcoming/ongoing events
  const filteredEvents = events.filter(
    (event) => !isEventOver(event.date, event.time)
  );

  // Group events by date (like Events page)
  const groupEventsByDate = (events: any[]) => {
    const grouped: { [key: string]: any[] } = {};
    events.forEach(event => {
      const dateKey = event.date;
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(event);
    });
    return Object.keys(grouped).sort().reduce((acc, date) => {
      acc[date] = grouped[date];
      return acc;
    }, {} as { [key: string]: any[] });
  };
  const groupedEvents = groupEventsByDate(filteredEvents);

  // Format date for display
  const formatDateHeader = (dateString: string) => {
    if (!dateString) return '';
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const eventDate = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', weekday: 'long' };
    if (eventDate.toDateString() === today.toDateString()) return 'Today';
    if (eventDate.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#8236A0' }}>
      {/* Themed Navbar with Pardah Gathering Logo */}
      <Navbar selectedCity={selectedCity} setSelectedCity={setSelectedCity} bgColor="#8236A0" logoSrc="/gatherings/purddahgath.png" />
      <main className="flex-grow pt-24 pb-20 md:pb-0">
        {/* Centered ticket-style logo above content */}
        <div className="flex flex-col items-center justify-center z-10 mt-8 mb-8">
          <img
            src="/gatherings/purddahgath.png"
            alt="Pardah Gathering Logo Center"
            className="h-80 w-auto object-contain drop-shadow-xl border-4 border-white rounded-2xl"
            style={{ maxWidth: '340px', background: '#8236A0' }}
          />
        </div>
        <div className="container-padding py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4" style={{ color: '#F7D774' }}>Pardah Gathering Events</h1>
            <p className="max-w-2xl mx-auto" style={{ color: '#F7D774' }}>
              Discover and book the best upcoming Pardah Gathering events happening in your city. All events are organized by date for easy browsing.
            </p>
          </div>
          {/* Event List */}
          {loadingTypes || loadingEvents || fetchingEvents ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#F7D774' }}></div>
            </div>
          ) : Object.keys(groupedEvents).length === 0 ? (
            <div className="text-center py-16 text-xl font-semibold" style={{ color: '#F7D774' }}>No upcoming Pardah Gathering events yet. Check back soon!</div>
          ) : (
            <div className="space-y-12">
              {Object.entries(groupedEvents).map(([date, dateEvents]) => (
                <div key={date}>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2" style={{ color: '#F7D774' }}>
                      {formatDateHeader(date)}
                    </h2>
                  </div>
                  {/* Event cards grid with purple color padding */}
                  <div className="rounded-3xl px-8 py-8" style={{ background: '#8236A0', border: '2px solid #fff' }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {dateEvents.map((event, index) => (
                        <Card key={event.id} className="hover-scale border-none shadow-soft overflow-hidden" style={{ backgroundColor: '#8236A0', border: '2px solid #fff' }}>
                          <div className="aspect-[9/16] h-96 relative">
                            <img
                              src={event.image}
                              alt={event.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <CardContent className="p-5" style={{ color: '#F7D774' }}>
                            <h3 className="text-lg font-bold mb-1" style={{ color: '#F7D774' }}>{event.title}</h3>
                            <p className="text-sm mb-4 line-clamp-2" style={{ color: '#F7D774' }}>{event.subtitle}</p>
                            <div className="flex items-center gap-2 text-sm mb-2" style={{ color: '#F7D774' }}>
                              <MapPin className="h-4 w-4" style={{ color: '#F7D774' }} />
                              <span>{event.city}, {event.venue}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm" style={{ color: '#F7D774' }}>
                              <Calendar className="h-4 w-4" style={{ color: '#F7D774' }} />
                              <span>{event.date}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm" style={{ color: '#F7D774' }}>
                              <Clock className="h-4 w-4" style={{ color: '#F7D774' }} />
                              <span>{event.time} {event.duration ? `• ${event.duration}` : ''}</span>
                            </div>
                          </CardContent>
                          <CardFooter className="px-5 pb-5 pt-0 flex justify-between items-center" style={{ color: '#F7D774' }}>
                            <div className="text-lg font-bold">₹{event.price}</div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="font-bold" 
                              style={{ background: '#F7D774', color: '#8236A0', border: 'none' }} 
                              onClick={() => navigate(getEventUrl(event))}
                            >
                              View Details
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      {/* Themed Footer */}
      <div style={{ backgroundColor: '#8236A0' }}>
        <Footer />
      </div>
    </div>
  );
};

export default PardahGathering; 