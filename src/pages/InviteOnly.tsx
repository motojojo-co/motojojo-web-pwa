import { useState, useEffect } from "react";
import { getAllPrivateEvents } from "@/services/eventService";
import { Event } from "@/services/eventService";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import { useToast } from "@/hooks/use-toast";
import { getEventUrl } from "@/lib/eventUtils";

interface InviteOnlyProps {
  tag?: string;
}

export default function InviteOnly({ tag = 'inviteonly' }: InviteOnlyProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadPrivateEvents();
  }, [toast]);

  const loadPrivateEvents = async () => {
    try {
      setLoading(true);
      const data = await getAllPrivateEvents();
      setEvents(data);
    } catch (error) {
      console.error("Error loading private events:", error);
      toast({
        title: "Error",
        description: "Failed to load your private events. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="container-padding">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">
                Loading your private events...
              </p>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container-padding">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Lock className="h-8 w-8 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold">Private Events</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              All currently listed private events. Share this page with your
              guests to let them access private event details directly.
            </p>
          </div>

          {/* Events Grid */}
          {events.length === 0 ? (
            <div className="text-center py-12">
              <Lock className="h-24 w-24 text-muted-foreground mx-auto mb-6" />
              <h3 className="text-2xl font-semibold mb-4">No Private Events</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                There are no private events at the moment. Please check back
                later.
              </p>
              <Button asChild>
                <Link to="/events">Browse Public Events</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <Card
                  key={event.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full aspect-[9/16] h-96 object-cover"
                    />
                    <Badge className="absolute top-3 right-3 bg-purple-600 hover:bg-purple-700">
                      <Lock className="h-3 w-3 mr-1" />
                      Private
                    </Badge>
                  </div>

                  <CardContent className="p-6">
                    <h3 className="font-bold text-xl mb-2 line-clamp-2">
                      {event.title}
                    </h3>
                    {event.subtitle && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {event.subtitle}
                      </p>
                    )}

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        {event.date}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-2" />
                        {event.time}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-2" />
                        {event.venue}, {event.city}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-lg font-semibold">
                        ₹{event.price}
                      </div>
                      <Button asChild size="sm">
                        <Link to={getEventUrl(event)}>View Details</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Info Section */}
          <div className="mt-16 bg-muted/30 rounded-lg p-8 text-center">
            <Users className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Private Event Access</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Private events may require specific access or invitations. Sharing
              this page allows guests to find the event, but some events may
              still require sign-in or an accepted invitation to view full
              details or book.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
