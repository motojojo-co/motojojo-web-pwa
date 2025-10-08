import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { getEventTypes, EventType } from "@/services/eventTypeService";
import { useQuery } from "@tanstack/react-query";
import EventOffersManager from "@/components/admin/EventOffersManager";
import { EventOffer, getEventOffers } from "@/services/eventOfferService";
import type { CustomTag } from "@/services/eventService";
import { createEvent } from "@/services/adminEventService";
import { ArrowLeft, Save, X } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  longDescription: z.string().optional(),
  city: z.string().min(1, "City is required"),
  venue: z.string().min(1, "Venue is required"),
  address: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  duration: z.string().optional(),
  host: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  eventType: z.string().optional(),
  price: z.number().min(0, "Price must be non-negative"),
  hasDiscount: z.boolean().default(false),
  isPrivate: z.boolean().default(false),
  realPrice: z.number().nullable().optional(),
  discountedPrice: z.number().nullable().optional(),
  basePrice: z.number().min(0, "Base price must be non-negative"),
  gst: z.number().min(0, "GST must be non-negative"),
  convenienceFee: z.number().min(0, "Convenience fee must be non-negative"),
  subtotal: z.number().min(0, "Subtotal must be non-negative"),
  ticketPrice: z.number().min(0, "Ticket price must be non-negative"),
  locationMapLink: z.string().url("Please enter a valid URL").optional(),
  seatsAvailable: z.number().min(0, "Seats available must be non-negative").default(100),
  // New timing fields
  doorsOpenTime: z.string().optional(),
  showStartTime: z.string().optional(),
  // New location fields
  nearestStation: z.string().optional(),
  addressRevealNote: z.string().optional(),
  lateArrivalNote: z.string().optional(),
  // New amenities fields
  alcoholAvailable: z.boolean().default(false),
  barAvailable: z.boolean().default(false),
  foodPolicy: z.string().optional(),
  seatingType: z.string().optional(),
  indoorOutdoor: z.string().optional(),
  // New info fields
  accessibilityInfo: z.string().optional(),
  parkingInfo: z.string().optional(),
  additionalInfo: z.string().optional(),
  customTags: z.array(z.object({
    tag: z.string().min(1, "Tag is required"),
    label: z.string().min(1, "Heading/Label is required"),
    value: z.string().min(1, "Details are required"),
    link: z.string().url().optional().or(z.literal("")),
  })).optional(),
});

type FormData = z.infer<typeof formSchema>;

const CreateEvent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [images, setImages] = useState<File[]>([]);
  const [offers, setOffers] = useState<EventOffer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customTags, setCustomTags] = useState<CustomTag[]>([]);

  // Prevent page refresh when switching tabs
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is being hidden (switching tabs)
        // Don't do anything that would cause a refresh
        return;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Fetch event types
  const { data: eventTypes = [], isLoading: eventTypesLoading } = useQuery({
    queryKey: ["event-types"],
    queryFn: getEventTypes,
    refetchOnWindowFocus: false,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      subtitle: "",
      description: "",
      longDescription: "",
      city: "",
      venue: "",
      address: "",
      date: "",
      time: "",
      duration: "",
      host: "",
      category: "",
      eventType: "",
      price: 0,
      hasDiscount: false,
      isPrivate: false,
      realPrice: null,
      discountedPrice: null,
      basePrice: 0,
      gst: 0,
      convenienceFee: 0,
      subtotal: 0,
      ticketPrice: 0,
      locationMapLink: "",
      seatsAvailable: 100,
      doorsOpenTime: "",
      showStartTime: "",
      nearestStation: "",
      addressRevealNote: "",
      lateArrivalNote: "",
      alcoholAvailable: false,
      barAvailable: false,
      foodPolicy: "",
      seatingType: "",
      indoorOutdoor: "",
      accessibilityInfo: "",
      parkingInfo: "",
      additionalInfo: "",
      customTags: [],
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(files);
  };

  const handleOffersChange = (newOffers: EventOffer[]) => {
    setOffers(newOffers);
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Upload images if any
      let imageUrls: string[] = [];
      if (images.length > 0) {
        const uploadPromises = images.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `event-images/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('event-images')
            .upload(filePath, file);
          
          if (uploadError) throw uploadError;
          
          const { data: { publicUrl } } = supabase.storage
            .from('event-images')
            .getPublicUrl(filePath);
          
          return publicUrl;
        });
        
        imageUrls = await Promise.all(uploadPromises);
      }

      // Create event data with proper field mapping
      const eventData = {
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        long_description: data.longDescription,
        city: data.city,
        venue: data.venue,
        address: data.address,
        date: data.date,
        time: data.time,
        duration: data.duration,
        host: data.host,
        category: data.category,
        event_type: data.eventType,
        price: data.price,
        has_discount: data.hasDiscount,
        is_private: data.isPrivate,
        real_price: data.realPrice,
        discounted_price: data.discountedPrice,
        base_price: data.basePrice,
        gst: data.gst,
        convenience_fee: data.convenienceFee,
        subtotal: data.subtotal,
        ticket_price: data.ticketPrice,
        location_map_link: data.locationMapLink,
        seats_available: data.seatsAvailable,
        doors_open_time: data.doorsOpenTime,
        show_start_time: data.showStartTime,
        nearest_station: data.nearestStation,
        address_reveal_note: data.addressRevealNote,
        late_arrival_note: data.lateArrivalNote,
        alcohol_available: data.alcoholAvailable,
        bar_available: data.barAvailable,
        food_policy: data.foodPolicy,
        seating_type: data.seatingType,
        indoor_outdoor: data.indoorOutdoor,
        accessibility_info: data.accessibilityInfo,
        parking_info: data.parkingInfo,
        additional_info: data.additionalInfo,
        images: imageUrls,
        image: imageUrls.length > 0 ? imageUrls[0] : '',
        offers: offers,
        custom_tags: customTags,
      };

      // Create the event
      await createEvent(eventData);

      toast({
        title: "Event Created Successfully",
        description: "Your event has been created and is now live.",
      });

      // Navigate back to admin dashboard
      navigate("/admin/dashboard");
    } catch (error) {
      console.error("Error creating event:", error);
      toast({
        title: "Error Creating Event",
        description: "There was an error creating the event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin/dashboard")}
                className="flex items-center space-x-2 text-black hover:text-gray-700"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-semibold text-black">Create New Event</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex items-center space-x-2 text-black border-gray-300 hover:bg-gray-50"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </Button>
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="flex items-center space-x-2 bg-primary hover:bg-primary/90 text-white"
              >
                <Save className="h-4 w-4" />
                <span>{isSubmitting ? "Creating..." : "Create Event"}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-black">Event Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column */}
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Title *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter event title" className="text-black" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subtitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Subtitle (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter event subtitle" className="text-black" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter event description"
                              className="min-h-[100px] text-black"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="longDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Long Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter detailed event description"
                              className="min-h-[120px] text-black"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div>
                      <FormLabel className="text-black">Event Images</FormLabel>
                      <Input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="mt-2 text-black"
                      />
                      {images.length > 0 && (
                        <p className="text-sm text-gray-600 mt-1">
                          {images.length} file(s) selected
                        </p>
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">City *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter city" className="text-black" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="venue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Venue *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter venue" className="text-black" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Address (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter full address" className="text-black" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Date *</FormLabel>
                          <FormControl>
                            <Input type="date" className="text-black" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Time *</FormLabel>
                          <FormControl>
                            <Input type="time" className="text-black" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Duration (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 2 hours" className="text-black" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="host"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Host *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter host name" className="text-black" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Category *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter category" className="text-black" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="eventType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Event Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an event type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {eventTypes.map((type: EventType) => (
                                <SelectItem key={type.id} value={type.id}>
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Price *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hasDiscount"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base text-black">Event has discount?</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {form.watch("hasDiscount") && (
                      <>
                        <FormField
                          control={form.control}
                          name="realPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-black">Real Price</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  className="text-black"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || null)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="discountedPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-black">Discounted Price</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  className="text-black"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || null)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    <FormField
                      control={form.control}
                      name="isPrivate"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base text-black">Private Event</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              When enabled, only invited users can view this event
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="basePrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black">Base Price</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                className="text-black"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="gst"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black">GST</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                className="text-black"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="convenienceFee"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black">Convenience Fee</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                className="text-black"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="subtotal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black">Subtotal</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                className="text-black"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="ticketPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black">Ticket Price</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                className="text-black"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="locationMapLink"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black">Google Maps Link</FormLabel>
                            <FormControl>
                              <Input
                                type="url"
                                placeholder="https://maps.google.com/..."
                                className="text-black"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="seatsAvailable"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black">Seats Available</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="100"
                                className="text-black"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Event Timing Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-black">Event Timing</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="doorsOpenTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Doors Open Time</FormLabel>
                          <FormControl>
                            <Input type="time" className="text-black" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="showStartTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Show Start Time</FormLabel>
                          <FormControl>
                            <Input type="time" className="text-black" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Location & Transportation Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-black">Location & Transportation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="nearestStation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Nearest Station</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Metro Station, Bus Stop" className="text-black" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="parkingInfo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Parking Information</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Parking details, charges, availability..." className="text-black" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="addressRevealNote"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Address Reveal Note</FormLabel>
                          <FormControl>
                            <Textarea placeholder="When and how will the address be revealed?" className="text-black" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lateArrivalNote"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Late Arrival Note</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Policy for late arrivals..." className="text-black" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Event Amenities Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-black">Event Amenities</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="alcoholAvailable"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base text-black">Alcohol Available</FormLabel>
                            <p className="text-sm text-gray-600">
                              Will alcohol be served at this event?
                            </p>
                          </div>
                          <FormControl>
                            <input 
                              type="checkbox" 
                              checked={field.value} 
                              onChange={(e) => field.onChange(e.target.checked)} 
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="barAvailable"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base text-black">Bar Available</FormLabel>
                            <p className="text-sm text-gray-600">
                              Will there be a bar at this event?
                            </p>
                          </div>
                          <FormControl>
                            <input 
                              type="checkbox" 
                              checked={field.value} 
                              onChange={(e) => field.onChange(e.target.checked)} 
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="foodPolicy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Food Policy</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Food policy, outside food allowed, etc." className="text-black" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="seatingType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Seating Type</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select seating type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="floor">Floor Seating</SelectItem>
                                <SelectItem value="chairs">Chairs</SelectItem>
                                <SelectItem value="mixed">Mixed Seating</SelectItem>
                                <SelectItem value="standing">Standing Only</SelectItem>
                                <SelectItem value="tables">Table Seating</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="indoorOutdoor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Indoor/Outdoor</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select venue type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="indoor">Indoor</SelectItem>
                                <SelectItem value="outdoor">Outdoor</SelectItem>
                                <SelectItem value="mixed">Mixed Indoor/Outdoor</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Accessibility & Additional Info Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-black">Accessibility & Additional Information</h3>
                  <div className="grid grid-cols-1 gap-6">
                    <FormField
                      control={form.control}
                      name="accessibilityInfo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Accessibility Information</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Wheelchair access, special accommodations, etc." className="text-black" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="additionalInfo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Additional Information</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Any other important information for attendees..." className="text-black" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Custom Tags & Details Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-black">Custom Tags & Details</h3>
                  <div className="space-y-3">
                    {customTags.length === 0 && (
                      <div className="text-sm text-gray-600">No custom details added yet.</div>
                    )}
                    {customTags.map((ct, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-start">
                        <div>
                          <label className="text-sm font-medium text-black">Tag</label>
                          <Input
                            value={ct.tag}
                            onChange={(e) => {
                              const next = [...customTags];
                              next[index] = { ...next[index], tag: e.target.value };
                              setCustomTags(next);
                              form.setValue("customTags", next as any);
                            }}
                            placeholder="e.g., policy, link, note"
                            className="text-black"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-black">Heading/Label</label>
                          <Input
                            value={ct.label}
                            onChange={(e) => {
                              const next = [...customTags];
                              next[index] = { ...next[index], label: e.target.value };
                              setCustomTags(next);
                              form.setValue("customTags", next as any);
                            }}
                            placeholder="e.g., Refund Policy"
                            className="text-black"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-black">Details</label>
                          <Input
                            value={ct.value}
                            onChange={(e) => {
                              const next = [...customTags];
                              next[index] = { ...next[index], value: e.target.value };
                              setCustomTags(next);
                              form.setValue("customTags", next as any);
                            }}
                            placeholder="Write details or text"
                            className="text-black"
                          />
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="text-sm font-medium text-black">Link (optional)</label>
                            <Input
                              value={ct.link || ""}
                              onChange={(e) => {
                                const next = [...customTags];
                                next[index] = { ...next[index], link: e.target.value || null };
                                setCustomTags(next);
                                form.setValue("customTags", next as any);
                              }}
                              placeholder="https://..."
                              className="text-black"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => {
                              const next = customTags.filter((_, i) => i !== index);
                              setCustomTags(next);
                              form.setValue("customTags", next as any);
                            }}
                            className="self-end"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      onClick={() => {
                        const next = [...customTags, { tag: "", label: "", value: "", link: null }];
                        setCustomTags(next);
                        form.setValue("customTags", next as any);
                      }}
                    >
                      Add Tag
                    </Button>
                  </div>
                </div>

                {/* Event Offers Section */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4 text-black">Event Offers</h3>
                  <EventOffersManager
                    eventId=""
                    offers={offers}
                    onOffersChange={handleOffersChange}
                  />
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateEvent;
