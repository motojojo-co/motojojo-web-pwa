import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getEventTypes } from "@/services/eventTypeService";
import { getEvents, getEventCities, getEventDates } from "@/services/eventService";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getEventUrl } from "@/lib/eventUtils";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

function isEventOver(date: string, time: string) {
  const eventDate = new Date(`${date}T${time}`);
  return eventDate < new Date();
}

const LocalGathering = () => {
  const navigate = useNavigate();
  const [eventTypeId, setEventTypeId] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Fetch event types to get the ID for 'Local Gathering'
  const { data: eventTypes = [], isLoading: loadingTypes } = useQuery({
    queryKey: ["event-types"],
    queryFn: getEventTypes,
  });

  useEffect(() => {
    if (eventTypes.length > 0) {
      const local = eventTypes.find(
        (et) => et.name.toLowerCase() === "local gathering"
      );
      setEventTypeId(local?.id || null);
    }
  }, [eventTypes]);

  // Fetch city and date options
  const { data: cities = [] } = useQuery({
    queryKey: ["event-cities"],
    queryFn: getEventCities,
  });
  const { data: dates = [] } = useQuery({
    queryKey: ["event-dates"],
    queryFn: getEventDates,
  });

  // Fetch events for this event type
  const {
    data: events = [],
    isLoading: loadingEvents,
    isFetching: fetchingEvents,
  } = useQuery({
    queryKey: ["local-gathering-events", eventTypeId, selectedCity, selectedDate],
    queryFn: () => {
      if (!eventTypeId) return [];
      const filters: any = { eventType: eventTypeId };
      if (selectedCity) filters.city = selectedCity;
      if (selectedDate) filters.date = selectedDate;
      return getEvents(filters);
    },
    enabled: !!eventTypeId,
  });

  // Only show upcoming/ongoing events
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
  const groupedEvents = groupEventsByDate(events);

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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0CA678' }}>
      {/* Green Navbar with Local Gathering Logo */}
      <Navbar selectedCity={selectedCity} setSelectedCity={setSelectedCity} bgColor="#0CA678" logoSrc="/gatherings/local%20gat%20logo.png" />
      <main className="flex-grow pt-24 pb-20 md:pb-0">
        {/* Centered logo above content */}
        <div className="flex flex-col items-center justify-center z-10 mt-8 mb-8">
          <img
            src="/gatherings/local%20gat%20logo.png"
            alt="Local Gathering Logo Center"
            className="h-32 w-auto md:h-48 object-contain drop-shadow-xl"
            style={{ maxWidth: '320px' }}
          />
        </div>
        <div className="container-padding py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 text-mapcream">Local Gathering Experiences</h1>
            <p className="text-mapcream max-w-2xl mx-auto">
            The Local Gathering experience doesn't need you to be anyone, not a friend, not a date.. Just, yourself. Enjoy an evening of indie music, deep conversations, and no expectations.  <br />
             For us, you are just a JoJo like everyone else.
            </p>
          </div>
          {/* Filters Section */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-center mb-8">
            <div className="w-full md:w-64">
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="bg-[#F7E1B5] text-[#0CA678] rounded-2xl font-medium border-none focus:ring-2 focus:ring-[#0CA678]">
                  <SelectValue placeholder="Filter by city" />
                </SelectTrigger>
                <SelectContent className="bg-[#F7E1B5] text-[#0CA678]">
                  {cities.map(city => (
                    <SelectItem key={city} value={city} className="text-[#0CA678]">{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-64">
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger className="bg-[#F7E1B5] text-[#0CA678] rounded-2xl font-medium border-none focus:ring-2 focus:ring-[#0CA678]">
                  <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent className="bg-[#F7E1B5] text-[#0CA678]">
                  {dates.map(date => (
                    <SelectItem key={date} value={date} className="text-[#0CA678]">{date}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(selectedCity || selectedDate) && (
              <Button variant="ghost" onClick={() => { setSelectedCity(""); setSelectedDate(""); }}>Clear Filters</Button>
            )}
          </div>
          {/* Event List */}
          {loadingTypes || loadingEvents || fetchingEvents ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          ) : Object.keys(groupedEvents).length === 0 ? (
            <div className="text-center py-16 text-mapcream text-xl font-semibold">No upcoming Local Gathering events yet. Check back soon!</div>
          ) : (
            <div className="space-y-12">
              {Object.entries(groupedEvents).map(([date, dateEvents]) => (
                <div key={date}>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-mapcream mb-2">
                      {formatDateHeader(date)}
                    </h2>
                  </div>
                  {/* Event cards grid with mapcream color padding */}
                  <div className="bg-[#F7E1B5] rounded-3xl px-8 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {dateEvents.map((event, index) => (
                        <Card key={event.id} className="hover-scale border-none shadow-soft overflow-hidden" style={{ backgroundColor: '#0CA678' }}>
                          <div className="aspect-[9/16] h-96 relative">
                            <img
                              src={event.image}
                              alt={event.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <CardContent className="p-5 text-mapcream">
                            <h3 className="text-lg font-bold mb-1 text-mapcream">{event.title}</h3>
                            <p className="text-sm mb-4 line-clamp-2 text-mapcream">{event.subtitle}</p>
                            <div className="flex items-center gap-2 text-sm mb-2 text-mapcream">
                              <MapPin className="h-4 w-4 text-mapcream" />
                              <span className="text-mapcream">{event.city}, {event.venue}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-mapcream">
                              <Calendar className="h-4 w-4 text-mapcream" />
                              <span className="text-mapcream">{event.date}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-mapcream">
                              <Clock className="h-4 w-4 text-mapcream" />
                              <span className="text-mapcream">{event.time} {event.duration ? `• ${event.duration}` : ''}</span>
                            </div>
                          </CardContent>
                          <CardFooter className="px-5 pb-5 pt-0 flex justify-between items-center text-mapcream">
                            <div className="text-lg font-bold text-mapcream">₹{event.price}</div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="bg-[#F7E1B5] text-[#0CA678] border-none hover:bg-[#e6d7a8] font-bold" 
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
      {/* Green Footer */}
      <div style={{ backgroundColor: '#0CA678' }}>
        <Footer />
      </div>
    </div>
  );
};

export default LocalGathering; 