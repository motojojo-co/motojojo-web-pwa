import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Events from "./pages/Events";
import PreviousEvents from "./pages/PreviousEvents";
import EventDetail from "./pages/EventDetail";
import Profile from "./pages/Profile";
import Cart from "./pages/Cart";
import Admin from "./pages/Admin";
import AdminDashboard from "./pages/AdminDashboard";
import HostLogin from "./pages/HostLogin";
import HostDashboard from "./pages/HostDashboard";
import HostInvitation from "./pages/HostInvitation";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import ExplorePremium from "./pages/ExplorePremium";
import PricingPage from "./pages/PricingPage";
import Membership from "./pages/Membership";
import MjMember from "./pages/MjMember";
import JoJoGang from "./pages/JoJoGang";
import TicketPreview from "./pages/TicketPreview";
import BookingTicketDemo from "./pages/BookingTicketDemo";
import Feedback from "./pages/Feedback";
import Response from "./pages/Response";
import SignInSignUp from "./pages/SignInSignUp";
import Contact from "./pages/Contact";
import Help from "./pages/Help";
import LocalGathering from "./pages/LocalGathering";
import Addebazi from "./pages/Addebazi";
import KitchenGathering from "./pages/KitchenGathering";
import PardahGathering from "./pages/PardahGathering";
import GhumakariKalakar from "./pages/GhumakariKalakar";
import AdminUsers from "./pages/AdminUsers";
import BookingPage from "./pages/BookingPage";
import ThankYou from "./pages/ThankYou";
import InviteOnly from "./pages/InviteOnly";
import JoinRequests from "./pages/admin/JoinRequests";
import BulkEmailPage from "./pages/admin/BulkEmail";
import ViewBooking from "./pages/admin/ViewBooking";
import CreateEvent from "./pages/admin/CreateEvent";
import Gallery from "./pages/Gallery";
import CommunityLeadLogin from "./pages/CommunityLeadLogin";
import CommunityLeadActivityNew from "./pages/CommunityLeadActivityNew";
import CommunityLeadCreateEvent from "./pages/CommunityLeadCreateEvent";
import CommunityLeadRevenue from "./pages/CommunityLeadRevenue";
import CommunityLeadEditEvent from "./pages/CommunityLeadEditEvent";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/events" element={<Events />} />
          <Route path="/previousevents" element={<PreviousEvents />} />
          {/* SEO-friendly event URL pattern */}
          <Route
            path="/events/:city/:eventName/:eventId"
            element={<EventDetail />}
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />
          <Route path="/admin" element={
            <ProtectedRoute adminOnly>
              <Admin />
            </ProtectedRoute>
          } />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/join-requests" element={
            <ProtectedRoute adminOnly>
              <JoinRequests />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute adminOnly>
              <AdminUsers />
            </ProtectedRoute>
          } />
          <Route path="/admin/bulk-email" element={
            <ProtectedRoute adminOnly>
              <BulkEmailPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/viewbooking" element={
            <ProtectedRoute adminOnly>
              <ViewBooking />
            </ProtectedRoute>
          } />
          <Route path="/admin/create-event" element={
            <ProtectedRoute adminOnly>
              <CreateEvent />
            </ProtectedRoute>
          } />
          <Route path="/host/login" element={<HostLogin />} />
          <Route path="/host/dashboard" element={<HostDashboard />} />
          <Route path="/host/invitation" element={<HostInvitation />} />
          <Route path="/explorepremium" element={<ExplorePremium />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/membership" element={<Membership />} />
          <Route path="/mjmember" element={<MjMember />} />
          <Route path="/jojogang" element={<JoJoGang />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/response" element={<Response />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/help" element={<Help />} />
          <Route path="/local-gathering" element={<LocalGathering />} />
          <Route path="/addebazi" element={<Addebazi />} />
          <Route path="/kitchen-gathering" element={<KitchenGathering />} />
          <Route path="/pardah-gathering" element={<PardahGathering />} />
          <Route path="/ghumakari-kalakar" element={<GhumakariKalakar />} />
          {/* Community Lead */}
          <Route path="/community-lead/login" element={<CommunityLeadLogin />} />
          <Route path="/communitylead/activity" element={
            <ProtectedRoute communityLeadOnly>
              <CommunityLeadActivityNew />
            </ProtectedRoute>
          } />
          <Route path="/communitylead/revenue" element={
            <ProtectedRoute communityLeadOnly>
              <CommunityLeadRevenue />
            </ProtectedRoute>
          } />
          <Route path="/communitylead/create-event" element={
            <ProtectedRoute communityLeadOnly>
              <CommunityLeadCreateEvent />
            </ProtectedRoute>
          } />
          <Route path="/communitylead/edit-event/:id" element={
            <ProtectedRoute communityLeadOnly>
              <CommunityLeadEditEvent />
            </ProtectedRoute>
          } />
          {/* Ticket preview route with booking ID */}
          <Route
            path="/ticket-preview/:bookingId"
            element={<TicketPreview />}
          />
          {/* QR code scan route with ticket ID */}
          <Route path="/ticket/:ticketId" element={<TicketPreview />} />
          {/* Demo ticket preview route */}
          <Route path="/ticket-preview" element={<TicketPreview />} />
          {/* Booking ticket demo route */}
          <Route path="/booking-ticket-demo" element={<BookingTicketDemo />} />
          {/* AUTH ROUTE */}
          <Route path="/auth" element={<SignInSignUp />} />
          <Route path="/inviteonly" element={<InviteOnly tag="inviteonly" />} />
          <Route path="/book/:eventId" element={<BookingPage />} />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="/gallery" element={<Gallery />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
