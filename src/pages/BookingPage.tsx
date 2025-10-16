import { useState, useEffect, useMemo, useRef } from "react";
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
import { sendEmail } from "@/services/emailService";
import { generateTicketPDFs } from "@/lib/pdf/generateTicketPDF";
import { createRazorpayOrder, verifyRazorpayPayment, initializeRazorpayCheckout } from "@/services/razorpayService";
import OfferSelection from "@/components/booking/OfferSelection";
import { getActiveMembership } from "@/services/membershipService";




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
  const [offerPricing, setOfferPricing] = useState<any>(null);
  const [hasMembership, setHasMembership] = useState(false);

  const { toast } = useToast();
  const { user, isSignedIn } = useAuth();
  const navigate = useNavigate();

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => getEvent(eventId!),
    enabled: !!eventId
  });

  useEffect(() => {
    const checkMembership = async () => {
      if (isSignedIn && user?.id) {
        const active = await getActiveMembership(user.id);
        setHasMembership(active.hasActive);
      } else {
        setHasMembership(false);
      }
    };
    checkMembership();
  }, [isSignedIn, user?.id]);

  // Derived calculation for total amount
  const originalTotal = useMemo(() => {
    if (!event) return 0;
    return event.ticket_price * formData.tickets;
  }, [event, formData.tickets]);

  // Calculate total with offers applied
  const totalAmount = useMemo(() => {
    let finalTotal = originalTotal;
    
    // Apply offer pricing if available
    if (offerPricing) {
      finalTotal = offerPricing.totalPrice;
    }
    
    // Premium members get free tickets
    if (hasMembership) {
      return 0;
    }

    // Apply coupon discount
    finalTotal = finalTotal - discount;
    
    return Math.max(0, finalTotal);
  }, [originalTotal, discount, offerPricing, hasMembership]);

  useEffect(() => {
    setTicketNames(Array(formData.tickets).fill(""));
    // Reset coupon if number of tickets changes
    setDiscount(0);
    setIsCouponApplied(false);
    setCoupon("");
    // Reset offer pricing when tickets change
    setOfferPricing(null);
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

  // Function to generate and send email with PDF tickets
  const sendBookingConfirmationEmail = async (booking: any) => {
    console.log('=== SENDING BOOKING CONFIRMATION EMAIL ===');
    try {
      // Generate PDF tickets
      const ticketData = {
        eventName: event.title,
        eventDescription: event.description || '',
        eventDate: event.date,
        eventTime: event.time || 'To be announced',
        eventVenue: event.venue || 'Venue to be announced',
        eventCity: event.city || '',
        bookerName: formData.name,
        ticketNumber: booking.id,
        ticketHolderName: formData.name, // For single ticket, use booker's name
        ticketPrice: event.ticket_price,
        bookingDate: new Date().toISOString(),
      };

      // If multiple tickets, generate one for each ticket holder
      const ticketsData = formData.tickets > 1 
        ? ticketNames.slice(0, formData.tickets).map((name, index) => ({
            ...ticketData,
            ticketNumber: `${booking.id}-${index + 1}`,
            ticketHolderName: name || `Guest ${index + 1}`,
            ticketPrice: Number(event.ticket_price) / formData.tickets, // Ensure number type
          }))
        : [ticketData];

      // Generate PDFs
      console.log('=== GENERATING PDF TICKETS ===');
      console.log('Tickets data:', ticketsData);
      
      const pdfBlobs = await generateTicketPDFs(ticketsData);
      console.log('PDF blobs generated:', pdfBlobs.length);
      
      // Convert blobs to base64 for email attachment
      // const attachments = await Promise.all(
      //   pdfBlobs.map(async (blob, index) => {
      //     const arrayBuffer = await blob.arrayBuffer();
      //     const buffer = Buffer.from(arrayBuffer);
      //     console.log(`Converting PDF ${index + 1} to base64...`);
      //     return {
      //       filename: `ticket-${ticketsData[index].ticketNumber}.pdf`,
      //       content: buffer.toString('base64'),
      //       contentType: 'application/pdf',
      //     };
      //   })
      // );
      
      // console.log('Attachments prepared:', attachments.length);

    // Prepare email content
const htmlContent = `
<div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; color: #333; line-height: 1.6; background: #fff;">
  
  <!-- Header -->
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #D32F55; font-size: 28px;">🎉 Woohoo! Your Spot is Reserved</h1>
    <p style="font-size: 16px; color: #666;">Thanks for booking with <strong>Motojojo</strong> — we can’t wait to see you!</p>
  </div>
  
  <!-- Event Card -->
  <div style="background-color: #fdf5f7; border-radius: 10px; padding: 20px; margin-bottom: 20px; border: 1px solid #f1c2ce;">
    <h2 style="margin-top: 0; color: #D32F55;">📌 Your Event Details</h2>
    <p><strong>${event.title}</strong></p>
    <p>📅 <strong>${new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></p>
    <p>📍 ${event.venue || 'Venue to be announced'}, ${event.city || ''}</p>
    <p>👥 ${formData.tickets} ticket${formData.tickets > 1 ? 's' : ''} booked for: <em>${ticketsData.map(t => t.ticketHolderName).join(', ')}</em></p>
    <p>💰 <strong>Total Paid:</strong> ₹${totalAmount.toLocaleString('en-IN')}</p>
  </div>

  <!-- Highlighted Note -->
  <div style="text-align: center; margin: 25px 0;"> 
    You can also find them anytime in your <a href="https://www.motojojo.co/profile?tab=bookings" style="color:#D32F55; text-decoration:none;">Motojojo Account</a>.</p>
  </div>

  <!-- What’s Next -->
  <div style="background: #f9f9f9; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #D32F55;">
    <h3 style="margin-top: 0; color: #D32F55;">🔍 What’s Next?</h3>
    <ul style="padding-left: 20px; margin: 0;">
      <li>📲 Save your ticket on your phone or print it out</li>
      <li>🚪 Carry a valid ID along with your ticket</li>
      <li>💫 Arrive early to soak in the vibes!</li>
    </ul>
  </div>
  
  <!-- Call to Action -->
  <div style="text-align: center; margin: 30px 0;">
    <a href="https://motojojo.co/events/${event.id}" 
       style="display: inline-block; padding: 12px 24px; background: #D32F55; color: #fff; border-radius: 6px; text-decoration: none; font-size: 16px; font-weight: bold;">
       View Event Details 🔗
    </a>
  </div>

  <!-- Footer -->
  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 13px; color: #777; text-align: center;">
    <p>Need help? Reply to this email or reach us at <a href="mailto:info@motojojo.co" style="color: #D32F55;">info@motojojo.co</a></p>
    <p>✨ Follow us on <a href="https://instagram.com/motojojo.co" style="color: #D32F55;">Instagram</a> for sneak peeks & updates</p>
    <p>© ${new Date().getFullYear()} Motojojo Events. All rights reserved.</p>
  </div>
</div>
`;


      const textContent = `Thank you for your booking!

Event: ${event.title}
Date: ${new Date(event.date).toLocaleDateString()}
Venue: ${event.venue || 'To be announced'}, ${event.city || ''}
Tickets: ${formData.tickets} (${ticketsData.map(t => t.ticketHolderName).join(', ')})
Total Paid: ₹${totalAmount.toLocaleString('en-IN')}

Your tickets are attached as PDFs.

Thank you for choosing Motojojo Events!`;

      // Send email using Spacemail
      console.log('=== SENDING BOOKING CONFIRMATION EMAIL ===');
      console.log('To:', formData.email);
      console.log('Subject:', `Your Booking Confirmation for '${event.title}'`);
      // console.log('Attachments count:', attachments.length);
      
      await sendEmail({
        to: formData.email,
        subject: `Your Booking Confirmation for '${event.title}'`,
        html: htmlContent,
        text: textContent,
        // attachments: attachments
      });

      console.log('Email with tickets sent successfully for booking:', booking.id);
      return true;
    } catch (error) {
      console.error('Error sending email with tickets:', error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Allow both authenticated and guest users to book
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

    try {
      // Handle free events (amount = 0)
      if (totalAmount === 0) {
        // For free events, create booking directly without payment
        const { data: booking, error } = await supabase
          .from('bookings')
          .insert({
            user_id: isSignedIn ? user.id : null, // Allow null for guest users
            event_id: eventId,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            tickets: formData.tickets,
            amount: totalAmount,
            status: 'confirmed',
            booking_date: new Date().toISOString(),
            ticket_names: formData.tickets > 1 ? ticketNames.slice(0, formData.tickets) : null,
            payment_id: 'FREE_EVENT',
            order_id: null,
            coupon_applied: isCouponApplied ? coupon.trim().toUpperCase() : null,
            discount_amount: discount,
            is_guest_booking: !isSignedIn, // Mark as guest booking
          })
          .select()
          .single();
        
        if (error) throw error;
        
        // Send confirmation email
        const emailSent = await sendBookingConfirmationEmail(booking);
        
        if (!emailSent) {
          console.warn('Email sending failed, but booking was successful');
        }
        
        toast({ 
          title: "Booking Successful!", 
          description: "Your free tickets have been booked and sent to your email." 
        });
        
        navigate("/thank-you", { state: { bookingId: booking.id } });
        return;
      }

      // For paid events, create Razorpay order first
      const orderResponse = await createRazorpayOrder({
        amount: totalAmount,
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`, // Shortened receipt format
        notes: {
          eventId: eventId,
          eventTitle: event.title,
          tickets: formData.tickets,
          customerName: formData.name,
          customerEmail: formData.email,
          couponApplied: isCouponApplied ? coupon.trim().toUpperCase() : null,
          discountAmount: discount
        }
      });

      if (!orderResponse.success) {
        throw new Error('Failed to create order');
      }

      // Initialize Razorpay checkout with order
      await initializeRazorpayCheckout(orderResponse.orderId, {
        key: "rzp_live_RBveSyibt8B7dS", // Live key for production
        // key: "rzp_test_AIaN0EfXmfZgMk", // Test key for development
        amount: totalAmount * 100,
        currency: "INR",
        name: event.title,
        description: "Event Ticket Booking",
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone
        },
        theme: {
          color: "#D32F55"
        },
        handler: async (response: any) => {
          // On successful payment, verify and create booking in Supabase
          try {
            // Verify the payment signature
            const verificationResponse = await verifyRazorpayPayment({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature
            });

            if (!verificationResponse.verified) {
              throw new Error('Payment verification failed');
            }

            const { data: booking, error } = await supabase
              .from('bookings')
              .insert({
                user_id: isSignedIn ? user.id : null, // Allow null for guest users
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
                order_id: response.razorpay_order_id,
                coupon_applied: isCouponApplied ? coupon.trim().toUpperCase() : null,
                discount_amount: discount,
                is_guest_booking: !isSignedIn, // Mark as guest booking
              })
              .select()
              .single();
            
            if (error) throw error;
            
            // Send confirmation email with PDF tickets
            const emailSent = await sendBookingConfirmationEmail(booking);
            
            if (!emailSent) {
              console.warn('Email sending failed, but booking was successful');
              // Optionally save this to retry later
            }
            
            toast({ 
              title: "Booking Successful!", 
              description: "Your tickets have been booked and sent to your email." 
            });
            
            navigate("/thank-you", { state: { bookingId: booking.id } });
          } catch (err: any) {
            console.error('Booking error:', err);
            toast({ 
              title: "Booking Failed", 
              description: err.message || "There was an error processing your booking.", 
              variant: "destructive" 
            });
          } finally {
            setIsBooking(false);
          }
        }
      });
    } catch (error: any) {
      console.error('Payment initialization error:', error);
      toast({ 
        title: "Payment Error", 
        description: error.message || "There was an error initializing payment. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setIsBooking(false);
    }
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
          
          {/* Guest User Notice */}
          {!isSignedIn && (
            <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
              <p className="text-blue-800 text-sm text-center">
                <strong>Guest Booking:</strong> You're booking as a guest. Your tickets will be sent to your email address.
              </p>
            </div>
          )}
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

            {/* Event Offers Section */}
            {event && event.offers && event.offers.length > 0 && (
              <OfferSelection
                event={event}
                basePrice={event.ticket_price || 0}
                quantity={formData.tickets}
                onPricingChange={setOfferPricing}
              />
            )}

            <div className="mt-2 text-right font-semibold text-yellow-300">
              <div>Base Price: <span className="text-black">₹{event.ticket_price?.toLocaleString()} x {formData.tickets} = ₹{originalTotal.toLocaleString()}</span></div>
              
                        {/* Show offer pricing if available */}
          {offerPricing && offerPricing.adjustments && offerPricing.adjustments.length > 0 && (
            <>
              {offerPricing.adjustments.map((adj, idx) => (
                <div key={idx} className={`text-sm ${adj.cost > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {adj.description}: <span className="text-black">
                    {adj.cost > 0 ? '+' : ''}₹{adj.cost.toLocaleString()}
                  </span>
                </div>
              ))}
              {offerPricing.savings > 0 && (
                <div>Total Savings: <span className="text-black text-green-600">- ₹{offerPricing.savings.toLocaleString()}</span></div>
              )}
              <div>After Offers: <span className="text-black">₹{offerPricing.totalPrice.toLocaleString()}</span></div>
            </>
          )}
              
              {hasMembership && (
                <div>Premium Member Benefit: <span className="text-black">Free Tickets</span></div>
              )}

              {isCouponApplied && (
                <div>Coupon Discount (10%): <span className="text-black">- ₹{discount.toLocaleString()}</span></div>
              )}
              <div className="text-lg">Final Total: <span className="text-black">₹{totalAmount.toLocaleString()}</span></div>
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
                  {isBooking ? "Processing..." : totalAmount === 0 ? "Book Free Tickets" : (isSignedIn ? "Proceed to Payment" : "Book as Guest")}
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
