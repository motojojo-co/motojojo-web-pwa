import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";
import { getEventTypes } from "@/services/eventTypeService";

const EventTypesSection = () => {
  const navigate = useNavigate();
  
  const { data: eventTypes = [], isLoading } = useQuery({
    queryKey: ['event-types'],
    queryFn: getEventTypes
  });

  // Debug: log all event type names and IDs
  if (eventTypes && eventTypes.length > 0) {
    console.log('Event Types:', eventTypes.map(et => ({ id: et.id, name: et.name })));
  }

  if (isLoading) {
    return (
      <section className="py-16">
        <div className="container-padding">
          <h2 className="section-title">Event Types</h2>
          <div className="flex justify-center py-8">
            <div className="animate-pulse flex space-x-4">
              <div className="h-12 w-12 bg-slate-200 rounded-full"></div>
              <div className="space-y-4 flex-1">
                <div className="h-4 bg-slate-200 rounded"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 overflow-hidden relative">
      <div>
        <FadeIn>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
            <h2 className="section-title text-white text-center md:text-left mb-4 md:mb-0">Event Types</h2>
          </div>
        </FadeIn>
        
        {/* Scrolling Animation Container */}
        <div className="relative">
          {/* Gradient overlays for smooth fade effect */}
          <div className="absolute left-0 top-0 bottom-0 w-12 md:w-20 bg-gradient-to-r from-raspberry to-transparent z-10"></div>
          <div className="absolute right-0 top-0 bottom-0 w-12 md:w-20 bg-gradient-to-l from-raspberry to-transparent z-10"></div>
          
          {/* Scrolling event types */}
          <div className="flex animate-scroll-event-types gap-6 items-center">
            {/* First set of event types */}
            {eventTypes.map((type, index) => {
              const name = (type.name || '').trim().toLowerCase();
              const isLocalGathering = name === 'local gathering';
              const isGhumakariKalaakar = name === 'ghumakari kalakar';
              const isAddebazi = name === 'addebazi';
              const isPardahGathering = name === 'pardah gathering';
              return (
                <div key={`first-${type.id}`} className="flex-shrink-0">
                  {isLocalGathering ? (
                    <button
                      type="button"
                      onClick={() => navigate('/local-gathering')}
                      className="focus:outline-none"
                    >
                      <Card className="w-[300px] md:w-[350px] hover-scale overflow-hidden border-none shadow-soft flex flex-col items-center justify-between">
                        <div className="relative h-80 overflow-hidden w-full bg-transparent">
                          {type.image_url ? (
                            <img
                              src={type.image_url}
                              alt={type.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `<div class='w-full h-full flex items-center justify-center text-2xl'>${type.icon || "🎭"}</div>`;
                                }
                              }}
                            />
                          ) : (
                            <div 
                              className="w-full h-full flex items-center justify-center text-2xl bg-violet/10 text-violet"
                            >
                              {type.icon || "🎭"}
                            </div>
                          )}
                        </div>
                      </Card>
                    </button>
                  ) : isGhumakariKalaakar ? (
                    <button
                      type="button"
                      onClick={() => navigate('/ghumakari-kalakar')}
                      className="focus:outline-none"
                    >
                      <Card className="w-[300px] md:w-[350px] hover-scale overflow-hidden border-none shadow-soft flex flex-col items-center justify-between">
                        <div className="relative h-80 overflow-hidden w-full bg-transparent">
                          {type.image_url ? (
                            <img
                              src={type.image_url}
                              alt={type.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `<div class='w-full h-full flex items-center justify-center text-2xl'>${type.icon || "🎭"}</div>`;
                                }
                              }}
                            />
                          ) : (
                            <div 
                              className="w-full h-full flex items-center justify-center text-2xl bg-violet/10 text-violet"
                            >
                              {type.icon || "🎭"}
                            </div>
                          )}
                        </div>
                      </Card>
                    </button>
                  ) : isAddebazi ? (
                    <button
                      type="button"
                      onClick={() => navigate('/addebazi')}
                      className="focus:outline-none"
                    >
                      <Card className="w-[300px] md:w-[350px] hover-scale overflow-hidden border-none shadow-soft flex flex-col items-center justify-between">
                        <div className="relative h-80 overflow-hidden w-full bg-transparent">
                          {type.image_url ? (
                            <img
                              src={type.image_url}
                              alt={type.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `<div class='w-full h-full flex items-center justify-center text-2xl'>${type.icon || "🎭"}</div>`;
                                }
                              }}
                            />
                          ) : (
                            <div 
                              className="w-full h-full flex items-center justify-center text-2xl bg-violet/10 text-violet"
                            >
                              {type.icon || "🎭"}
                            </div>
                          )}
                        </div>
                      </Card>
                    </button>
                  ) : isPardahGathering ? (
                    <button
                      type="button"
                      onClick={() => navigate('/pardah-gathering')}
                      className="focus:outline-none"
                    >
                      <Card className="w-[300px] md:w-[350px] hover-scale overflow-hidden border-none shadow-soft flex flex-col items-center justify-between">
                        <div className="relative h-80 overflow-hidden w-full bg-transparent">
                          {type.image_url ? (
                            <img
                              src={type.image_url}
                              alt={type.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `<div class='w-full h-full flex items-center justify-center text-2xl'>${type.icon || "🎭"}</div>`;
                                }
                              }}
                            />
                          ) : (
                            <div 
                              className="w-full h-full flex items-center justify-center text-2xl bg-violet/10 text-violet"
                            >
                              {type.icon || "🎭"}
                            </div>
                          )}
                        </div>
                      </Card>
                    </button>
                  ) : (
                    <Link to={`/events?type=${type.id}`}>
                      <Card className="w-[300px] md:w-[350px] hover-scale overflow-hidden border-none shadow-soft flex flex-col items-center justify-between">
                        <div className="relative h-80 overflow-hidden w-full bg-transparent">
                          {type.image_url ? (
                            <img
                              src={type.image_url}
                              alt={type.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `<div class='w-full h-full flex items-center justify-center text-2xl'>${type.icon || "🎭"}</div>`;
                                }
                              }}
                            />
                          ) : (
                            <div 
                              className="w-full h-full flex items-center justify-center text-2xl bg-violet/10 text-violet"
                            >
                              {type.icon || "🎭"}
                            </div>
                          )}
                        </div>
                      </Card>
                    </Link>
                  )}
                </div>
              );
            })}
            
            {/* Duplicate set for seamless loop */}
          {eventTypes.map((type, index) => {
            const name = (type.name || '').trim().toLowerCase();
            const isLocalGathering = name === 'local gathering';
            const isGhumakariKalaakar = name === 'ghumakari kalakar';
            const isAddebazi = name === 'addebazi';
            const isPardahGathering = name === 'pardah gathering';
            return (
                <div key={`second-${type.id}`} className="flex-shrink-0">
                {isLocalGathering ? (
                  <button
                    type="button"
                    onClick={() => navigate('/local-gathering')}
                    className="focus:outline-none"
                  >
                    <Card className="w-[300px] md:w-[350px] hover-scale overflow-hidden border-none shadow-soft flex flex-col items-center justify-between">
                      <div className="relative h-80 overflow-hidden w-full bg-transparent">
                        {type.image_url ? (
                          <img
                            src={type.image_url}
                            alt={type.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `<div class='w-full h-full flex items-center justify-center text-2xl'>${type.icon || "🎭"}</div>`;
                              }
                            }}
                          />
                        ) : (
                          <div 
                            className="w-full h-full flex items-center justify-center text-2xl bg-violet/10 text-violet"
                          >
                            {type.icon || "🎭"}
                          </div>
                        )}
                      </div>
                    </Card>
                  </button>
                ) : isGhumakariKalaakar ? (
                  <button
                    type="button"
                    onClick={() => navigate('/ghumakari-kalakar')}
                    className="focus:outline-none"
                  >
                    <Card className="w-[300px] md:w-[350px] hover-scale overflow-hidden border-none shadow-soft flex flex-col items-center justify-between">
                      <div className="relative h-80 overflow-hidden w-full bg-transparent">
                        {type.image_url ? (
                          <img
                            src={type.image_url}
                            alt={type.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `<div class='w-full h-full flex items-center justify-center text-2xl'>${type.icon || "🎭"}</div>`;
                              }
                            }}
                          />
                        ) : (
                          <div 
                            className="w-full h-full flex items-center justify-center text-2xl bg-violet/10 text-violet"
                          >
                            {type.icon || "🎭"}
                          </div>
                        )}
                      </div>
                    </Card>
                  </button>
                ) : isAddebazi ? (
                  <button
                    type="button"
                    onClick={() => navigate('/addebazi')}
                    className="focus:outline-none"
                  >
                    <Card className="w-[300px] md:w-[350px] hover-scale overflow-hidden border-none shadow-soft flex flex-col items-center justify-between">
                      <div className="relative h-80 overflow-hidden w-full bg-transparent">
                        {type.image_url ? (
                          <img
                            src={type.image_url}
                            alt={type.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `<div class='w-full h-full flex items-center justify-center text-2xl'>${type.icon || "🎭"}</div>`;
                              }
                            }}
                          />
                        ) : (
                          <div 
                            className="w-full h-full flex items-center justify-center text-2xl bg-violet/10 text-violet"
                          >
                            {type.icon || "🎭"}
                          </div>
                        )}
                      </div>
                    </Card>
                  </button>
                ) : isPardahGathering ? (
                  <button
                    type="button"
                    onClick={() => navigate('/pardah-gathering')}
                    className="focus:outline-none"
                  >
                    <Card className="w-[300px] md:w-[350px] hover-scale overflow-hidden border-none shadow-soft flex flex-col items-center justify-between">
                      <div className="relative h-80 overflow-hidden w-full bg-transparent">
                        {type.image_url ? (
                          <img
                            src={type.image_url}
                            alt={type.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `<div class='w-full h-full flex items-center justify-center text-2xl'>${type.icon || "🎭"}</div>`;
                              }
                            }}
                          />
                        ) : (
                          <div 
                            className="w-full h-full flex items-center justify-center text-2xl bg-violet/10 text-violet"
                          >
                            {type.icon || "🎭"}
                          </div>
                        )}
                      </div>
                    </Card>
                  </button>
                ) : (
                  <Link to={`/events?type=${type.id}`}>
                    <Card className="w-[300px] md:w-[350px] hover-scale overflow-hidden border-none shadow-soft flex flex-col items-center justify-between">
                      <div className="relative h-80 overflow-hidden w-full bg-transparent">
                        {type.image_url ? (
                          <img
                            src={type.image_url}
                            alt={type.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `<div class='w-full h-full flex items-center justify-center text-2xl'>${type.icon || "🎭"}</div>`;
                              }
                            }}
                          />
                        ) : (
                          <div 
                            className="w-full h-full flex items-center justify-center text-2xl bg-violet/10 text-violet"
                          >
                            {type.icon || "🎭"}
                          </div>
                        )}
                      </div>
                    </Card>
                  </Link>
                )}
                </div>
            );
          })}
          </div>
        </div>
        
        <div className="mt-8 text-center px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
          <Button 
            variant="outline" 
            className="border-white text-white hover:bg-white/10 rounded-full px-8"
            asChild
          >
            <Link to="/events">View All Event Types</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default EventTypesSection;
