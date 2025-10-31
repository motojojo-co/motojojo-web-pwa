import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getCommunityLeadEvents, deleteEventForCommunityLead } from "@/services/communityLeadService";
import { format } from "date-fns";
import CommunityLeadMembers from "@/components/CommunityLeadMembers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CommunityLeadActivityNew = () => {
  const { isLoaded, isSignedIn, isCommunityLead } = useAuth();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["community-lead-events", user?.id],
    queryFn: () => getCommunityLeadEvents(user?.id || ""),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (isLoaded && !isSignedIn) navigate("/community-lead/login");
  }, [isLoaded, isSignedIn, navigate]);

  if (!isLoaded) return null;
  if (!isSignedIn) return null;

  // Derived stats
  const totalEvents = events.length;
  const upcomingEvents = events.filter((e: any) => e.date && new Date(e.date) >= new Date()).length;
  const pastEvents = totalEvents - upcomingEvents;

  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      <Navbar />
      <main className="flex-grow pt-40 pb-20 md:pb-16">
        <div className="container-padding max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-extrabold">Community Lead Dashboard</h1>
              <p className="text-gray-600">Manage your events, track performance, and create new experiences.</p>
            </div>
            <div className="flex gap-2">
              <Button className="bg-yellow text-black hover:bg-yellow-400" onClick={() => navigate("/communitylead/create-event")}>Create Event</Button>
              <Button variant="outline" className="text-black" onClick={() => navigate("/communitylead/revenue")}>View Revenue</Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600">Total Events</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-bold">{isLoading ? '-' : totalEvents}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600">Upcoming</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-bold">{isLoading ? '-' : upcomingEvents}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600">Past</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-bold">{isLoading ? '-' : pastEvents}</div></CardContent>
            </Card>
          </div>

          {/* Main Content with Tabs */}
          <Tabs defaultValue="events" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="events">Your Events</TabsTrigger>
              <TabsTrigger value="members">Community Members</TabsTrigger>
            </TabsList>
            
            <TabsContent value="events">
              <Card className="border-none shadow-soft">
                <CardHeader>
                  <CardTitle className="text-xl">Your Events</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p>Loading events...</p>
                  ) : events.length === 0 ? (
                    <div className="text-gray-600">No events yet. Click "Create Event" to get started.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {events.map((e: any) => (
                        <Card key={e.id}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg truncate">{e.title}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-sm text-gray-700 mb-2">{e.city} • {e.date ? format(new Date(e.date), "MMM dd, yyyy") : "TBA"}</div>
                            <div className="flex gap-2">
                              <Button variant="outline" className="text-black" onClick={() => navigate(`/events/${e.id}`)}>View</Button>
                              <Button variant="outline" className="text-black" onClick={() => navigate(`/communitylead/edit-event/${e.id}`)}>Edit</Button>
                              <Button variant="outline" className="text-black" onClick={async () => {
                                if (!confirm('Delete this event?')) return;
                                try {
                                  await deleteEventForCommunityLead(e.id, user!.id);
                                  window.location.reload();
                                } catch (err) {
                                  alert('Delete failed');
                                }
                              }}>Delete</Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="members">
              <CommunityLeadMembers />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CommunityLeadActivityNew;
