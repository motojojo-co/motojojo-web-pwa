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
import { Calendar, Users, LogOut, TrendingUp } from "lucide-react";

const CommunityLeadActivityNew = () => {
  const { isLoaded, isSignedIn, isCommunityLead, signOut } = useAuth();
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

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const leadTabs = [
    { value: "events", label: "Your Events", icon: Calendar },
    { value: "members", label: "Community Members", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Tabs defaultValue="events" className="w-full">
        <div className="flex min-h-screen">
          <aside className="hidden lg:flex w-72 flex-col border-r border-slate-200 bg-white sticky top-0 h-screen">
            <div className="px-7 py-6 border-b border-slate-200">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Motojojo
              </div>
              <div className="text-lg font-semibold text-slate-900">Community Lead</div>
            </div>
            <div className="px-5 py-6 overflow-y-auto">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500 px-2 mb-4">
                Navigation
              </div>
              <TabsList className="flex h-auto w-full flex-col items-stretch justify-start gap-2 bg-transparent p-0">
                {leadTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="justify-start gap-3 rounded-xl px-4 py-2.5 text-left text-sm data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur">
              <div className="container-padding py-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-4">
                    <TrendingUp className="h-8 w-8 text-violet" />
                    <div>
                      <h1 className="text-2xl font-semibold text-slate-900">Community Lead Dashboard</h1>
                      <p className="text-sm text-slate-600">
                        Manage your events and community.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={() => navigate("/communitylead/revenue")}>
                      View Revenue
                    </Button>
                    <Button onClick={() => navigate("/communitylead/create-event")}>
                      Create Event
                    </Button>
                    <Button variant="outline" onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </div>
            </header>

            <main className="py-8 pb-20 md:pb-8">
              <div className="container-padding max-w-6xl mx-auto">
                <div className="lg:hidden mb-6">
                  <TabsList className="grid h-auto w-full grid-cols-2 gap-3 bg-transparent p-0">
                    {leadTabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <TabsTrigger
                          key={tab.value}
                          value={tab.value}
                          className="justify-start gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-left text-sm data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 text-slate-600"
                        >
                          <Icon className="h-4 w-4" />
                          <span className="truncate">{tab.label}</span>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  <Card className="border border-slate-200 bg-white shadow-sm rounded-2xl">
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">Total Events</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold">{isLoading ? '-' : totalEvents}</div></CardContent>
                  </Card>
                  <Card className="border border-slate-200 bg-white shadow-sm rounded-2xl">
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">Upcoming</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold">{isLoading ? '-' : upcomingEvents}</div></CardContent>
                  </Card>
                  <Card className="border border-slate-200 bg-white shadow-sm rounded-2xl">
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-600">Past</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold">{isLoading ? '-' : pastEvents}</div></CardContent>
                  </Card>
                </div>

                <TabsContent value="events">
                  <Card className="border border-slate-200 bg-white shadow-sm rounded-2xl">
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
                            <Card key={e.id} className="border border-slate-200 bg-white shadow-sm rounded-2xl">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-lg truncate">{e.title}</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="text-sm text-gray-700 mb-2">{e.city} • {e.date ? format(new Date(e.date), "MMM dd, yyyy") : "TBA"}</div>
                                <div className="flex flex-wrap gap-2">
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
              </div>
            </main>
          </div>
        </div>
      </Tabs>
    </div>
  );
};

export default CommunityLeadActivityNew;
