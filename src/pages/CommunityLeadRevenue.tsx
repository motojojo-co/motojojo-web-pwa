import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { useAuth } from "@/hooks/use-auth";
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCommunityLeadRevenue } from "@/services/communityLeadService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, TrendingUp, Users, IndianRupee } from "lucide-react";

const CommunityLeadRevenue = () => {
  const { isLoaded, isSignedIn, isCommunityLead, user } = useAuth();
  const navigate = useNavigate();
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const { data } = useQuery({
    queryKey: ["community-lead-revenue", user?.id],
    queryFn: () => getCommunityLeadRevenue(user?.id || ""),
    enabled: !!user?.id,
    retry: 1,
  });

  useEffect(() => {
    if (isLoaded && (!isSignedIn || !isCommunityLead)) {
      navigate("/community-lead/login");
    }
  }, [isLoaded, isSignedIn, isCommunityLead, navigate]);

  const totalRevenue = data?.totalRevenue || 0;
  const totalBookings = data?.totalBookings || 0;
  const communityLeadCommission = data?.communityLeadCommission || 0;
  const revenueByEvent = data?.revenueByEvent || [];

  // Derived KPIs
  const avgRevenuePerEvent = useMemo(() => {
    if (!revenueByEvent.length) return 0;
    return Math.round(totalRevenue / revenueByEvent.length);
  }, [totalRevenue, revenueByEvent.length]);

  const avgBookingValue = useMemo(() => {
    if (!totalBookings) return 0;
    return Math.round(totalRevenue / totalBookings);
  }, [totalRevenue, totalBookings]);

  // Filter (date bounds are not present per-event; keep UI for future integration)
  const filteredEvents = revenueByEvent; // placeholder for future server-side date filter

  // CSV Export
  const exportCsv = () => {
    const rows = [
      ["Event Title", "Bookings", "Revenue", "Commission (10%)"],
      ...filteredEvents.map((r: any) => [r.event_title, r.bookings_count, r.revenue, r.commission]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `community-lead-revenue-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      <Navbar />
      <main className="flex-grow pt-36 pb-10">
        <div className="container-padding max-w-6xl mx-auto">
          {/* Header / Filters */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-extrabold">Revenue</h1>
              <p className="text-gray-600">Track your earnings and performance across events.</p>
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  <strong>Commission Structure:</strong> You earn 10% commission on all revenue from events you create and manage.
                </p>
              </div>
            </div>
            <div className="flex gap-2 items-end">
              <div>
                <label className="text-xs text-gray-600">From</label>
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="min-w-[10rem]" />
              </div>
              <div>
                <label className="text-xs text-gray-600">To</label>
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="min-w-[10rem]" />
              </div>
              <Button className="bg-yellow text-black hover:bg-yellow-400" onClick={exportCsv}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
            </div>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600 flex items-center gap-1"><IndianRupee className="h-4 w-4" />Total Revenue</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-bold">₹{totalRevenue.toLocaleString()}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600 flex items-center gap-1"><Users className="h-4 w-4" />Total Bookings</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-bold">{totalBookings}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600 flex items-center gap-1"><TrendingUp className="h-4 w-4" />Avg Revenue / Event</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-bold">₹{avgRevenuePerEvent.toLocaleString()}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600 flex items-center gap-1"><TrendingUp className="h-4 w-4" />Avg Booking Value</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-bold">₹{avgBookingValue.toLocaleString()}</div></CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-green-700 flex items-center gap-1"><IndianRupee className="h-4 w-4" />Your Commission (10%)</CardTitle></CardHeader>
              <CardContent><div className="text-3xl font-bold text-green-600">₹{communityLeadCommission.toLocaleString()}</div></CardContent>
            </Card>
          </div>

          {/* Revenue by Event */}
          <Card>
            <CardHeader>
              <CardTitle className="text-black">Revenue by Event (with 10% Commission)</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredEvents.length === 0 ? (
                <p>No revenue yet. Create events to start earning.</p>
              ) : (
                <div className="space-y-4">
                  {filteredEvents
                    .slice()
                    .sort((a: any, b: any) => b.revenue - a.revenue)
                    .map((r: any) => (
                    <div key={r.event_id} className="border rounded p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{r.event_title}</div>
                          <div className="text-xs text-gray-600">Bookings: {r.bookings_count}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">₹{r.revenue.toLocaleString()}</div>
                          <div className="text-sm text-green-600 font-semibold">Commission: ₹{r.commission.toLocaleString()}</div>
                        </div>
                      </div>
                      {/* Proportional bar */}
                      <div className="mt-3 h-2 bg-gray-200 rounded">
                        <div className="h-2 bg-yellow rounded" style={{ width: `${totalRevenue ? Math.min(100, Math.round((r.revenue / totalRevenue) * 100)) : 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CommunityLeadRevenue;
