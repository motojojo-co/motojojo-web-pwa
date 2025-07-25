import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { ScrollableNumberInput } from "@/components/ui/scrollable-number-input";
import BookingTicket from "@/components/tickets/BookingTicket";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getEvent } from "@/services/eventService";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";

const BookingPage = () => {
  const { eventId } = useParams();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    tickets: 1
  });
  const [ticketNames, setTicketNames] = useState<string[]>([""]);
  const [isBooking, setIsBooking] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [selectedCity, setSelectedCity] = useState("");

  const { toast } = useToast();
  const { user, isSignedIn } = useAuth();
  const navigate = useNavigate();

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => getEvent(eventId!),
    enabled: !!eventId
  });

  // Derived calculation for total amount
  const originalTotal = useMemo(() => {
    if (!event) return 0;
    return event.ticket_price * formData.tickets;
  }, [event, formData.tickets]);

  const totalAmount = useMemo(() => {
    return originalTotal - discount;
  }, [originalTotal, discount]);

  useEffect(() => {
    setTicketNames(Array(formData.tickets).fill(""));
    // Reset coupon if number of tickets changes
    setDiscount(0);
    setIsCouponApplied(false);
    setCoupon("");
  }, [formData.tickets]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      if (name === 'tickets') {
        const ticketCount = parseInt(value) || 1;
        return { ...prev, [name]: Math.max(1, Math.min(15, ticketCount)) };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleTicketCountChange = (value: number) => {
    setFormData(prev => ({ ...prev, tickets: value }));
  };

  const handleTicketNameChange = (index: number, value: string) => {
    setTicketNames(prev => {
      const newNames = [...prev];
      newNames[index] = value;
      return newNames;
    });
  };

  const handleApplyCoupon = () => {
    if (coupon.trim().toUpperCase() === "10%ARITSTI-M") {
        const calculatedDiscount = originalTotal * 0.10;
        setDiscount(calculatedDiscount);
        setIsCouponApplied(true);
        toast({ title: "Coupon Applied!", description: "You've received a 10% discount." });
    } else {
        toast({ title: "Invalid Coupon", description: "The coupon code is not valid.", variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn) {
      toast({ title: "Please sign in", description: "You need to be signed in to book tickets.", variant: "destructive" });
      return;
    }
    if (!formData.name || !formData.email || !formData.phone) {
      toast({ title: "Missing Information", description: "Please fill in all the required fields.", variant: "destructive" });
      return;
    }
    if (formData.tickets > 1) {
      const emptyNames = ticketNames.slice(0, formData.tickets).some(name => !name.trim());
      if (emptyNames) {
        toast({ title: "Missing Ticket Holder Names", description: "Please provide names for all ticket holders.", variant: "destructive" });
        return;
      }
    }

    setIsBooking(true);

    // Load Razorpay script if not already loaded
    if (!(window as any).Razorpay) {
      await new Promise<void>((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => resolve();
        document.body.appendChild(script);
      });
    }

    // Calculate amount in paise
    const amountInPaise = totalAmount * 100;

    // Razorpay options
    const options = {
      key: "rzp_live_yAyC4YmewB4VQG", // Live key for production
      // key: "rzp_test_AIaN0EfXmfZgMk", // Test key for development
      amount: amountInPaise,
      currency: "INR",
      name: event.title,
      description: "Event Ticket Booking",
      handler: async (response: any) => {
        // On successful payment, create booking in Supabase
        try {
          const { data: booking, error } = await supabase
            .from('bookings')
            .insert({
              user_id: user.id,
              event_id: eventId,
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              tickets: formData.tickets,
              amount: totalAmount, // Save the final discounted amount
              status: 'confirmed',
              booking_date: new Date().toISOString(),
              ticket_names: formData.tickets > 1 ? ticketNames.slice(0, formData.tickets) : null,
              payment_id: response.razorpay_payment_id,
              coupon_applied: isCouponApplied ? coupon.trim().toUpperCase() : null,
              discount_amount: discount,
            })
            .select()
            .single();
          if (error) throw error;
          toast({ title: "Booking Successful!", description: "Your tickets have been booked and sent to your email." });
          navigate("/thank-you", { state: { bookingId: booking.id } });
        } catch (err: any) {
          toast({ title: "Booking Failed", description: err.message || "There was an error processing your booking.", variant: "destructive" });
        } finally {
          setIsBooking(false);
        }
      },
      prefill: {
        name: formData.name,
        email: formData.email,
        contact: formData.phone
      },
      theme: {
        color: "#D32F55"
      }
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
    setIsBooking(false);
  };

  if (isLoading) return <div>Loading event details...</div>;
  if (!event) return <div>Event not found.</div>;

  return (
    <div className="min-h-screen flex flex-col bg-raspberry">
      <Navbar selectedCity={selectedCity} setSelectedCity={setSelectedCity} />
      <main className="flex justify-center py-6 px-2 sm:px-0">
        <div className="w-full max-w-lg lg:max-w-xl rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 mx-auto flex flex-col justify-center mt-12" style={{ background: '#D32F55', minHeight: 'auto' }}>
          <h2 className="text-2xl font-bold mb-2 text-center text-yellow-300">Complete Your Booking</h2>
          <p className="mb-4 text-center text-yellow-300">Please provide your details to book tickets for <b className="text-yellow-300">{event.title}</b>.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Price Breakdown */}
            <div className="mb-2">
              <div className="text-xl font-bold mb-1 text-white">Price Breakdown</div>
              <div className="text-base text-white">Base Price: <span className="font-semibold">₹{event.base_price?.toLocaleString() ?? 0}</span></div>
              <div className="text-base text-white">GST: <span className="font-semibold">₹{event.gst?.toLocaleString() ?? 0}</span></div>
              <div className="text-base text-white">Convenience Fee: <span className="font-semibold">₹{event.convenience_fee?.toLocaleString() ?? 0}</span></div>
              <div className="text-base text-white">Subtotal: <span className="font-semibold">₹{event.subtotal?.toLocaleString() ?? 0}</span></div>
              <div className="text-lg font-bold mt-2 text-yellow-300">Ticket Price: <span className="text-yellow-300">₹{event.ticket_price?.toLocaleString() ?? 0}</span></div>
            </div>
            <div>
              <Label htmlFor="name" className="text-yellow-300">Full Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Enter your full name" required className="bg-gray-100/60 text-black placeholder:text-gray-600 focus:bg-gray-200/80" />
            </div>
            <div>
              <Label htmlFor="email" className="text-yellow-300">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Enter your email address" required className="bg-gray-100/60 text-black placeholder:text-gray-600 focus:bg-gray-200/80" />
            </div>
            <div>
              <Label htmlFor="phone" className="text-yellow-300">WhatsApp Number</Label>
              <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="Enter your WhatsApp number" required className="bg-gray-100/60 text-black placeholder:text-gray-600 focus:bg-gray-200/80" />
            </div>
            <div>
              <Label htmlFor="tickets" className="text-yellow-300">Number of Tickets</Label>
              <ScrollableNumberInput value={formData.tickets} onChange={handleTicketCountChange} min={1} max={15} className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-black" />
            </div>
            {formData.tickets > 1 && (
              <div className="grid gap-3">
                <Label className="text-sm font-medium text-yellow-300">Ticket Holder Names</Label>
                <div className="text-xs mb-2 text-yellow-300">Please provide the name for each person attending</div>
                {ticketNames.slice(0, formData.tickets).map((name, index) => (
                  <div key={index} className="grid gap-2">
                    <Label htmlFor={`ticket-name-${index}`} className="text-sm text-yellow-300">Ticket {index + 1} - Attendee Name</Label>
                    <Input id={`ticket-name-${index}`} value={name} onChange={e => handleTicketNameChange(index, e.target.value)} placeholder={`Enter name for ticket ${index + 1}`} required className="bg-gray-100/60 text-black placeholder:text-gray-600 focus:bg-gray-200/80" />
                  </div>
                ))}
              </div>
            )}
             {/* Coupon Code Section */}
            <div>
                <Label htmlFor="coupon" className="text-yellow-300">Coupon Code</Label>
                <div className="flex gap-2">
                    <Input
                        id="coupon"
                        name="coupon"
                        value={coupon}
                        onChange={(e) => setCoupon(e.target.value)}
                        placeholder="Enter coupon code"
                        disabled={isCouponApplied}
                        className="bg-gray-100/60 text-black placeholder:text-gray-600 focus:bg-gray-200/80 disabled:opacity-50"
                    />
                    <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={isCouponApplied || !coupon.trim()}
                        className="px-4 py-2 rounded-lg font-bold text-sm text-black bg-yellow-300 hover:bg-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Apply
                    </button>
                </div>
            </div>

            <div className="mt-2 text-right font-semibold text-yellow-300">
              <div>Price: <span className="text-black">₹{event.ticket_price?.toLocaleString()} x {formData.tickets} = ₹{originalTotal.toLocaleString()}</span></div>
              {isCouponApplied && (
                <div>Discount (10%): <span className="text-black">- ₹{discount.toLocaleString()}</span></div>
              )}
              <div className="text-lg">Total: <span className="text-black">₹{totalAmount.toLocaleString()}</span></div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <button
                type="button"
                className="w-full py-3 rounded-lg font-bold text-black bg-yellow-300 hover:bg-yellow-400 transition border border-yellow-400"
                onClick={() => setShowPreview(true)}
              >
                Preview Ticket
              </button>
              <button
                type="submit"
                className={cn("w-full py-3 rounded-lg font-bold text-black bg-yellow-300 hover:bg-yellow-400 transition", { 'opacity-60 pointer-events-none': isBooking })}
                disabled={isBooking}
              >
                {isBooking ? "Processing..." : "Proceed to Payment"}
              </button>
            </div>
          </form>
          {/* Ticket Preview Modal/Section */}
          {showPreview && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-2" onClick={() => setShowPreview(false)}>
              <div className="rounded-xl shadow-xl p-4 max-w-md w-full relative" style={{ background: '#D32F55' }} onClick={e => e.stopPropagation()}>
                <button
                  className="absolute top-2 right-2 text-yellow-300 text-xl font-bold hover:text-black"
                  onClick={() => setShowPreview(false)}
                  aria-label="Close Preview"
                >
                  ×
                </button>
                <BookingTicket
                  eventName={event.title}
                  eventDescription={event.subtitle || event.description || ''}
                  eventDate={event.date}
                  eventTime={event.time}
                  eventVenue={event.venue}
                  eventCity={event.city}
                  eventPrice={event.ticket_price}
                  bookerName={formData.name || 'Your Name'}
                  bookerEmail={formData.email || 'your@email.com'}
                  bookerPhone={formData.phone || 'Your Phone'}
                  numberOfTickets={formData.tickets}
                  totalAmount={totalAmount} // Use the final discounted amount
                  ticketHolderNames={formData.tickets > 1 ? ticketNames.slice(0, formData.tickets) : undefined}
                />
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BookingPage;
