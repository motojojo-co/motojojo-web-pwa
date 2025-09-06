import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FadeIn } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { getAllBookings } from "@/services/bookingService";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Users,
  ArrowLeft,
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";

const ViewBooking = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch all bookings using React Query
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: getAllBookings,
  });

  // Helper functions for pagination
  const getCurrentItems = (list) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return list.slice(startIndex, startIndex + itemsPerPage);
  };

  const totalPages = (list) => Math.ceil(list.length / itemsPerPage);

  // Helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <ProtectedRoute adminOnly>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/admin/dashboard")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-black mb-2">View Bookings</h1>
            <p className="text-muted-foreground">
              View and manage all user bookings, separated by event status
            </p>
          </div>

          <FadeIn delay={100}>
            <Card>
              <CardHeader>
                <CardTitle className="text-black">User Bookings</CardTitle>
                <CardDescription className="text-black">
                  View and manage all user bookings, separated by event status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Event Booking Count Summary */}
                {bookings.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-2 text-black">
                      Seats Booked Per Event
                    </h3>
                    {(() => {
                      const now = new Date("2025-08-07T13:05:04+05:30");
                      // Helper to group bookings by event and sum tickets
                      const groupByEvent = (bookingsList) => {
                        const eventTicketMap = new Map();
                        bookingsList.forEach((booking) => {
                          const eventId = booking.event_id;
                          const eventTitle =
                            booking.event?.title || "Event not found";
                          if (!eventTicketMap.has(eventId)) {
                            eventTicketMap.set(eventId, {
                              title: eventTitle,
                              count: 0,
                            });
                          }
                          eventTicketMap.get(eventId).count += booking.tickets;
                        });
                        return Array.from(eventTicketMap.values()).sort(
                          (a, b) => a.title.localeCompare(b.title)
                        );
                      };
                      // Split bookings by event status
                      const currentEventBookings = bookings.filter(
                        (b) => b.event?.date && new Date(b.event.date) >= now
                      );
                      const previousEventBookings = bookings.filter(
                        (b) => b.event?.date && new Date(b.event.date) < now
                      );
                      const groupedCurrent = groupByEvent(currentEventBookings);
                      const groupedPrevious = groupByEvent(previousEventBookings);

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                            <h4 className="font-semibold mb-2 text-black">
                              Current/Ongoing Events
                            </h4>
                            <div className="overflow-x-auto">
                              <Table className="text-black min-w-[320px]">
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="text-black">
                                      Event
                                    </TableHead>
                                    <TableHead className="text-black">
                                      Total Seats Booked
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {groupedCurrent.length === 0 ? (
                                    <TableRow>
                                      <TableCell
                                        colSpan={2}
                                        className="text-center text-muted-foreground py-4"
                                      >
                                        No bookings for current/ongoing events.
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    groupedCurrent.map(({ title, count }) => (
                                      <TableRow key={title}>
                                        <TableCell className="font-medium text-black">
                                          {title}
                                        </TableCell>
                                        <TableCell className="text-black">
                                          {count}
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2 text-black">
                              Previous/Completed Events
                            </h4>
                            <div className="overflow-x-auto">
                              <Table className="text-black min-w-[320px]">
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="text-black">
                                      Event
                                    </TableHead>
                                    <TableHead className="text-black">
                                      Total Seats Booked
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {groupedPrevious.length === 0 ? (
                                    <TableRow>
                                      <TableCell
                                        colSpan={2}
                                        className="text-center text-muted-foreground py-4"
                                      >
                                        No bookings for previous/completed
                                        events.
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    groupedPrevious.map(({ title, count }) => (
                                      <TableRow key={title}>
                                        <TableCell className="font-medium text-black">
                                          {title}
                                        </TableCell>
                                        <TableCell className="text-black">
                                          {count}
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {bookingsLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[250px]" />
                          <Skeleton className="h-4 w-[200px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2 text-black">
                      No Bookings Found
                    </h3>
                    <p className="text-muted-foreground">
                      There are no bookings in the system yet.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Split bookings by event status */}
                    {(() => {
                      const now = new Date("2025-08-07T13:01:50+05:30");
                      const isCurrentEvent = (booking) => {
                        if (!booking.event?.date) return false;
                        return new Date(booking.event.date) >= now;
                      };
                      const isPastEvent = (booking) => {
                        if (!booking.event?.date) return false;
                        return new Date(booking.event.date) < now;
                      };
                      const currentBookings = bookings.filter(isCurrentEvent);
                      const previousBookings = bookings.filter(isPastEvent);

                      const filterBookings = (list) =>
                        list.filter((booking) => {
                          const matchesSearch =
                            booking.name
                              .toLowerCase()
                              .includes(searchTerm.toLowerCase()) ||
                            booking.email
                              .toLowerCase()
                              .includes(searchTerm.toLowerCase()) ||
                            (
                              booking.event?.title?.toLowerCase() || ""
                            ).includes(searchTerm.toLowerCase());
                          const matchesStatus =
                            statusFilter === "all" ||
                            booking.status === statusFilter;
                          return matchesSearch && matchesStatus;
                        });
                      const filteredCurrent = filterBookings(currentBookings);
                      const filteredPrevious = filterBookings(previousBookings);

                      return (
                        <div className="space-y-12">
                          {/* Current Bookings */}
                          <div>
                            <h3 className="text-xl font-bold mb-2 text-black">
                              Current Bookings (Ongoing/Upcoming Events)
                            </h3>
                            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                              <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input
                                  placeholder="Search by name, email, or event..."
                                  value={searchTerm}
                                  onChange={(e) =>
                                    setSearchTerm(e.target.value)
                                  }
                                  className="pl-10"
                                />
                              </div>
                              <Select
                                value={statusFilter}
                                onValueChange={setStatusFilter}
                              >
                                <SelectTrigger className="w-full sm:w-[180px]">
                                  <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Status</SelectItem>
                                  <SelectItem value="confirmed">
                                    Confirmed
                                  </SelectItem>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="cancelled">
                                    Cancelled
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="mb-2">
                              <p className="text-sm text-muted-foreground">
                                Showing {filteredCurrent.length} of{" "}
                                {currentBookings.length} current bookings
                              </p>
                            </div>
                            <div className="rounded-md border">
                              <Table className="text-black">
                                <TableHeader className="text-black">
                                  <TableRow className="text-black">
                                    <TableHead className="text-black">
                                      Event
                                    </TableHead>
                                    <TableHead className="text-black">
                                      User
                                    </TableHead>
                                    <TableHead className="text-black">
                                      Email
                                    </TableHead>
                                    <TableHead className="text-black">
                                      Phone
                                    </TableHead>
                                    <TableHead className="text-black">
                                      Tickets
                                    </TableHead>
                                    <TableHead className="text-black">
                                      Amount
                                    </TableHead>
                                    <TableHead className="text-black">
                                      Status
                                    </TableHead>
                                    <TableHead className="text-black">
                                      Booking Date
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody className="text-black">
                                  {filteredCurrent.length === 0 ? (
                                    <TableRow>
                                      <TableCell
                                        colSpan={8}
                                        className="text-center text-muted-foreground py-8"
                                      >
                                        No current bookings found.
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    getCurrentItems(filteredCurrent).map(
                                      (booking) => (
                                        <TableRow
                                          key={booking.id}
                                          className="text-black"
                                        >
                                          <TableCell className="font-medium text-black">
                                            {booking.event?.title ||
                                              "Event not found"}
                                          </TableCell>
                                          <TableCell className="text-black">
                                            {booking.name}
                                          </TableCell>
                                          <TableCell className="text-black">
                                            {booking.email}
                                          </TableCell>
                                          <TableCell className="text-black">
                                            {booking.phone}
                                          </TableCell>
                                          <TableCell className="text-black">
                                            {booking.tickets}
                                          </TableCell>
                                          <TableCell className="text-black">
                                            ₹{booking.amount.toLocaleString()}
                                          </TableCell>
                                          <TableCell>
                                            <span
                                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-black ${
                                                booking.status === "confirmed"
                                                  ? "bg-green-100 text-green-800"
                                                  : "bg-yellow-100 text-yellow-800"
                                              }`}
                                            >
                                              {booking.status}
                                            </span>
                                          </TableCell>
                                          <TableCell className="text-black">
                                            {formatDate(booking.booking_date)}
                                          </TableCell>
                                        </TableRow>
                                      )
                                    )
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                            {totalPages(filteredCurrent) > 1 && (
                              <div className="flex justify-end items-center space-x-2 mt-4">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() =>
                                    setCurrentPage((prev) =>
                                      Math.max(prev - 1, 1)
                                    )
                                  }
                                  disabled={currentPage === 1}
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                  Page {currentPage} of{" "}
                                  {totalPages(filteredCurrent)}
                                </span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() =>
                                    setCurrentPage((prev) =>
                                      Math.min(
                                        prev + 1,
                                        totalPages(filteredCurrent)
                                      )
                                    )
                                  }
                                  disabled={
                                    currentPage === totalPages(filteredCurrent)
                                  }
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                          {/* Previous Bookings */}
                          <div>
                            <h3 className="text-xl font-bold mb-2 text-black">
                              Previous Bookings (Completed Events)
                            </h3>
                            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                              <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input
                                  placeholder="Search by name, email, or event..."
                                  value={searchTerm}
                                  onChange={(e) =>
                                    setSearchTerm(e.target.value)
                                  }
                                  className="pl-10"
                                />
                              </div>
                              <Select
                                value={statusFilter}
                                onValueChange={setStatusFilter}
                              >
                                <SelectTrigger className="w-full sm:w-[180px]">
                                  <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Status</SelectItem>
                                  <SelectItem value="confirmed">
                                    Confirmed
                                  </SelectItem>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="cancelled">
                                    Cancelled
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="mb-2">
                              <p className="text-sm text-muted-foreground">
                                Showing {filteredPrevious.length} of{" "}
                                {previousBookings.length} previous bookings
                              </p>
                            </div>
                            <div className="rounded-md border">
                              <Table className="text-black">
                                <TableHeader className="text-black">
                                  <TableRow className="text-black">
                                    <TableHead className="text-black">
                                      Event
                                    </TableHead>
                                    <TableHead className="text-black">
                                      User
                                    </TableHead>
                                    <TableHead className="text-black">
                                      Email
                                    </TableHead>
                                    <TableHead className="text-black">
                                      Phone
                                    </TableHead>
                                    <TableHead className="text-black">
                                      Tickets
                                    </TableHead>
                                    <TableHead className="text-black">
                                      Amount
                                    </TableHead>
                                    <TableHead className="text-black">
                                      Status
                                    </TableHead>
                                    <TableHead className="text-black">
                                      Booking Date
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody className="text-black">
                                  {filteredPrevious.length === 0 ? (
                                    <TableRow>
                                      <TableCell
                                        colSpan={8}
                                        className="text-center text-muted-foreground py-8"
                                      >
                                        No previous bookings found.
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    getCurrentItems(filteredPrevious).map(
                                      (booking) => (
                                        <TableRow
                                          key={booking.id}
                                          className="text-black"
                                        >
                                          <TableCell className="font-medium text-black">
                                            {booking.event?.title ||
                                              "Event not found"}
                                          </TableCell>
                                          <TableCell className="text-black">
                                            {booking.name}
                                          </TableCell>
                                          <TableCell className="text-black">
                                            {booking.email}
                                          </TableCell>
                                          <TableCell className="text-black">
                                            {booking.phone}
                                          </TableCell>
                                          <TableCell className="text-black">
                                            {booking.tickets}
                                          </TableCell>
                                          <TableCell className="text-black">
                                            ₹{booking.amount.toLocaleString()}
                                          </TableCell>
                                          <TableCell>
                                            <span
                                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-black ${
                                                booking.status === "confirmed"
                                                  ? "bg-green-100 text-green-800"
                                                  : "bg-yellow-100 text-yellow-800"
                                              }`}
                                            >
                                              {booking.status}
                                            </span>
                                          </TableCell>
                                          <TableCell className="text-black">
                                            {formatDate(booking.booking_date)}
                                          </TableCell>
                                        </TableRow>
                                      )
                                    )
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                            {totalPages(filteredPrevious) > 1 && (
                              <div className="flex justify-end items-center space-x-2 mt-4">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() =>
                                    setCurrentPage((prev) =>
                                      Math.max(prev - 1, 1)
                                    )
                                  }
                                  disabled={currentPage === 1}
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                  Page {currentPage} of{" "}
                                  {totalPages(filteredPrevious)}
                                </span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() =>
                                    setCurrentPage((prev) =>
                                      Math.min(
                                        prev + 1,
                                        totalPages(filteredPrevious)
                                      )
                                    )
                                  }
                                  disabled={
                                    currentPage === totalPages(filteredPrevious)
                                  }
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )}
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ViewBooking;
