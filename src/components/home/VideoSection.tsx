import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, MapPin, Calendar, Clock, MapPin as MapPinIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getEvents, getEventCities } from '@/services/eventService';
import { format } from 'date-fns';
import './TVEffect.css';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  city: string;
  venue: string;
  image: string;
  price: number;
  category: string;
  description: string;
}

const VideoSection = () => {
  const [isMuted, setIsMuted] = useState(true);
  const [selectedCity, setSelectedCity] = useState('Mumbai');
  const [cities, setCities] = useState<string[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch cities and initial events
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Auto-play the video
        videoRef.current?.play().catch(console.error);
        
        // Fetch available cities
        const cities = await getEventCities();
        setCities(cities);
        
        // Fetch events for the selected city
        await fetchEvents(selectedCity);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch events when city changes
  const fetchEvents = async (city: string) => {
    try {
      setIsLoading(true);
      const cityEvents = await getEvents({ city, eventType: 'experience' });
      setEvents(cityEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCityChange = async (city: string) => {
    setSelectedCity(city);
    await fetchEvents(city);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Format date to show day, month, and date
  const formatEventDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'EEE, MMM d');
    } catch (error) {
      return dateString;
    }
  };

  return (
    <section className="py-16 px-4 bg-transparent">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Watch Our Experiences
          </h2>
          <div className="w-24 h-1 bg-yellow-400 mx-auto"></div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Video Container - Left Side */}
          <div className="lg:w-1/2 relative">
            <div className="relative tv-frame">
              <div className="tv-screen">
                <video 
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                  poster="/placeholder-video.jpg"
                >
                  <source src="/Image_Animated_To_Modern_Video.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                
                {/* TV Scan Lines Effect */}
                <div className="absolute inset-0 tv-scanlines"></div>
                
                {/* TV Noise Effect */}
                <div className="absolute inset-0 tv-noise opacity-10"></div>
                
                {/* TV Screen Curvature */}
                <div className="absolute inset-0 tv-curvature"></div>
                
                {/* Sound Toggle Button */}
                <button 
                  onClick={toggleMute}
                  className="absolute bottom-6 right-6 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all backdrop-blur-sm tv-control"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
                
                {/* TV Power Light */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_2px_rgba(239,68,68,0.7)] animate-pulse"></div>
              </div>
              
              {/* TV Stand */}
              <div className="tv-stand">
                <div className="tv-stand-neck"></div>
                <div className="tv-stand-base"></div>
              </div>
            </div>
            
            {/* TV Antennas */}
            <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 w-40 h-24">
              <div className="absolute top-0 left-1/2 w-1 h-16 bg-gray-400 transform -translate-x-1/2"></div>
              <div className="absolute top-0 left-1/2 w-16 h-1 bg-gray-400 transform -translate-x-1/2"></div>
              <div className="absolute top-0 left-1/2 w-1 h-16 bg-gray-400 transform -translate-x-1/2">
                <div className="absolute top-0 left-0 w-8 h-1 bg-gray-400 transform -rotate-45 origin-top-left"></div>
              </div>
            </div>
          </div>
          
          {/* Experiences Container - Right Side */}
          <div className="lg:w-1/2">
            <div className="bg-[#D12B4D] p-6 rounded-3xl shadow-2xl h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">
                  Unique Experiences in {selectedCity}
                </h3>
                <div className="flex items-center text-sm text-white/90">
                  <MapPin className="w-4 h-4 mr-2" />
                  <select 
                    value={selectedCity}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 focus:ring-offset-0 text-white font-medium cursor-pointer appearance-none pr-6 bg-no-repeat bg-right"
                    style={{
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'white\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")',
                      backgroundPosition: 'right 0.25rem center',
                      backgroundSize: '1rem',
                    }}
                    disabled={isLoading}
                  >
                    {cities.map(city => (
                      <option key={city} value={city} className="text-gray-900">{city}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="space-y-4 overflow-y-auto max-h-[400px] pr-2 -mr-2">
                {isLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                ) : events.length > 0 ? (
                  events.map((event) => (
                    <div 
                      key={event.id} 
                      className="group flex items-start p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all cursor-pointer backdrop-blur-sm"
                      onClick={() => {
                        // Navigate to event detail page or show modal
                        console.log('Event clicked:', event.id);
                      }}
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-white/20">
                        {event.image ? (
                          <img 
                            src={event.image} 
                            alt={event.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-event.jpg';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/40">
                            <Calendar className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <h4 className="font-semibold text-white group-hover:text-yellow-300 transition-colors truncate">
                          {event.title}
                        </h4>
                        <div className="flex items-center text-xs text-white/80 mt-1">
                          <Calendar className="w-3 h-3 mr-1" />
                          <span>{formatEventDate(event.date)}</span>
                          <span className="mx-2">•</span>
                          <Clock className="w-3 h-3 mr-1" />
                          <span>{event.time}</span>
                        </div>
                        <div className="flex items-center text-xs text-white/80 mt-1">
                          <MapPinIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{event.venue}</span>
                        </div>
                        <div className="mt-2">
                          <span className="text-sm font-bold text-yellow-300">
                            ₹{event.price.toLocaleString()}
                          </span>
                          <span className="text-xs text-white/70 ml-2">• {event.category}</span>
                        </div>
                      </div>
                      <div className="ml-2 flex items-center">
                        <svg className="w-5 h-5 text-white/70 group-hover:text-yellow-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-white/70">
                    No experiences found in {selectedCity}.
                  </div>
                )}
              </div>
              
              <Button 
                variant="outline"
                className="mt-6 w-full py-6 text-base bg-transparent border-2 border-white text-white hover:bg-white/10 hover:text-white transition-all group"
                onClick={() => {
                  // Navigate to all experiences page
                  console.log('View all experiences');
                }}
              >
                View All Experiences
                <svg 
                  className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VideoSection;
