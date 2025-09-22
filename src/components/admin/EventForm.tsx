import { useState, useEffect } from "react";
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
import { Card, CardContent, CardYellowContainer } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { getEventTypes, EventType } from "@/services/eventTypeService";
import { useQuery } from "@tanstack/react-query";
import EventOffersManager from "./EventOffersManager";
import { EventOffer, getEventOffers } from "@/services/eventOfferService";
import type { CustomTag } from "@/services/eventService";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  long_description: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  duration: z.string().optional(),
  venue: z.string().min(1, "Venue is required"),
  city: z.string().min(1, "City is required"),
  address: z.string().optional(),
  price: z.number().min(0, "Price must be non-negative"),
  images: z.array(z.string()).min(1, "At least one image is required"),
  category: z.string().min(1, "Category is required"),
  event_type: z.string().optional(),
  host: z.string().optional(),
  is_published: z.boolean().default(true),
  is_private: z.boolean().default(false),
  has_discount: z.boolean().default(false),
  real_price: z.number().nullable().optional(),
  discounted_price: z.number().nullable().optional(),
  base_price: z.number().min(0, "Base price must be non-negative"),
  gst: z.number().min(0, "GST must be non-negative"),
  convenience_fee: z.number().min(0, "Convenience fee must be non-negative"),
  subtotal: z.number().min(0, "Subtotal must be non-negative"),
  ticket_price: z.number().min(0, "Ticket price must be non-negative"),
  location_map_link: z.string().url("Please enter a valid URL").optional(),
  offers: z.array(z.any()).optional(),
  seats_available: z.number().min(0, "Seats available must be non-negative").default(100),
  // New timing fields
  doors_open_time: z.string().optional(),
  show_start_time: z.string().optional(),
  // New location fields
  nearest_station: z.string().optional(),
  address_reveal_note: z.string().optional(),
  late_arrival_note: z.string().optional(),
  // New amenities fields
  alcohol_available: z.boolean().default(false),
  bar_available: z.boolean().default(false),
  food_policy: z.string().optional(),
  seating_type: z.string().optional(),
  indoor_outdoor: z.string().optional(),
  // New info fields
  accessibility_info: z.string().optional(),
  parking_info: z.string().optional(),
  additional_info: z.string().optional(),
  custom_tags: z
    .array(
      z.object({
        tag: z.string().min(1, "Tag is required"),
        label: z.string().min(1, "Heading/Label is required"),
        value: z.string().min(1, "Details are required"),
        link: z.string().url().optional().or(z.literal("")),
      })
    )
    .optional(),
});

type EventFormData = z.infer<typeof formSchema>;

interface EventFormProps {
  initialData?: Partial<EventFormData & { id?: string }>;
  onSubmit: (data: EventFormData) => Promise<void>;
  isEditing?: boolean;
}

export default function EventForm({ initialData, onSubmit, isEditing = false }: EventFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [eventOffers, setEventOffers] = useState<EventOffer[]>([]);
  const [customTags, setCustomTags] = useState<CustomTag[]>(initialData?.custom_tags || []);

  const { data: eventTypes = [] } = useQuery({
    queryKey: ['eventTypes'],
    queryFn: getEventTypes
  });

  // Fetch offers when editing an existing event
  useEffect(() => {
    if (isEditing && initialData?.id) {
      const loadOffers = async () => {
        try {
          // First try to get offers from initialData
          if (initialData.offers && initialData.offers.length > 0) {
            setEventOffers(initialData.offers);
          } else {
            // If no offers in initialData, fetch from database
            const fetchedOffers = await getEventOffers(initialData.id);
            setEventOffers(fetchedOffers);
          }
        } catch (error) {
          console.error("Error loading offers:", error);
          // If there's an error, set empty array
          setEventOffers([]);
        }
      };
      
      loadOffers();
    }
  }, [isEditing, initialData?.id, initialData?.offers]);

  // 2. Update default values for images
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      subtitle: initialData?.subtitle || "",
      description: initialData?.description || "",
      long_description: initialData?.long_description || "",
      date: initialData?.date || "",
      time: initialData?.time || "",
      duration: initialData?.duration || "",
      venue: initialData?.venue || "",
      city: initialData?.city || "",
      address: initialData?.address || "",
      price: initialData?.price || 0,
      images: initialData?.images || [],
      category: initialData?.category || "",
      event_type: initialData?.event_type || "",
      host: initialData?.host || "",
      is_published: initialData?.is_published ?? true,
      is_private: initialData?.is_private ?? false,
      has_discount: initialData?.has_discount ?? false,
      real_price: initialData?.real_price ?? null,
      discounted_price: initialData?.discounted_price ?? null,
      base_price: initialData?.base_price || 0,
      gst: initialData?.gst || 0,
      convenience_fee: initialData?.convenience_fee || 0,
      subtotal: initialData?.subtotal || 0,
      ticket_price: initialData?.ticket_price || 0,
      location_map_link: initialData?.location_map_link || "",
      offers: initialData?.offers || [],
      seats_available: initialData?.seats_available || 100,
      // New timing fields
      doors_open_time: initialData?.doors_open_time || "",
      show_start_time: initialData?.show_start_time || "",
      // New location fields
      nearest_station: initialData?.nearest_station || "",
      address_reveal_note: initialData?.address_reveal_note || "",
      late_arrival_note: initialData?.late_arrival_note || "",
      // New amenities fields
      alcohol_available: initialData?.alcohol_available ?? false,
      bar_available: initialData?.bar_available ?? false,
      food_policy: initialData?.food_policy || "",
      seating_type: initialData?.seating_type || "",
      indoor_outdoor: initialData?.indoor_outdoor || "",
      // New info fields
      accessibility_info: initialData?.accessibility_info || "",
      parking_info: initialData?.parking_info || "",
      additional_info: initialData?.additional_info || "",
      custom_tags: initialData?.custom_tags || [],
    },
  });

  const handleSubmit = async (data: EventFormData) => {
    try {
      setIsSubmitting(true);
      
      // Format offers data to match the expected database structure
      const formattedData = {
        ...data,
        custom_tags: customTags,
        offers: eventOffers.map(offer => ({
          id: offer.id.startsWith('temp-') ? `offer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : offer.id,
          offer_type: offer.offer_type,
          title: offer.title,
          description: offer.description || '',
          price_adjustment: offer.price_adjustment,
          min_quantity: offer.min_quantity,
          max_quantity: offer.max_quantity || null,
          group_size: offer.group_size,
          conditions: offer.conditions || {},
          is_active: offer.is_active,
          valid_from: offer.valid_from || new Date().toISOString(),
          valid_until: offer.valid_until || null,
          created_at: offer.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))
      };
      
      console.log('Submitting event with formatted offers:', formattedData.offers);
      
      await onSubmit(formattedData);
      toast({
        title: `Event ${isEditing ? "updated" : "created"} successfully!`,
        description: `The event "${data.title}" has been ${isEditing ? "updated" : "created"}.`,
      });
      if (!isEditing) {
        form.reset(); // Reset form after successful creation
      }
    } catch (error: any) {
      console.error("Error submitting event:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit the event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CardYellowContainer>
      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>Subtitle (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="long_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Long Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="images"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Images</FormLabel>
                      <FormControl>
                        <>
                          <Input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={async (e) => {
                              const files = Array.from(e.target.files || []);
                              if (!files.length) return;
                              setUploading(true);
                              try {
                                const uploadedUrls: string[] = [];
                                for (const file of files) {
                                  const fileExt = file.name.split('.').pop();
                                  const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
                                  const { data, error } = await supabase.storage
                                    .from('event-images')
                                    .upload(fileName, file, {
                                      cacheControl: '3600',
                                      upsert: false
                                    });
                                  if (error) {
                                    toast({
                                      title: 'Image Upload Failed',
                                      description: error.message,
                                      variant: 'destructive',
                                    });
                                    continue;
                                  }
                                  const { data: publicUrlData } = supabase.storage
                                    .from('event-images')
                                    .getPublicUrl(data.path);
                                  if (publicUrlData?.publicUrl) {
                                    uploadedUrls.push(publicUrlData.publicUrl);
                                  }
                                }
                                // Merge with existing images
                                field.onChange([...(field.value || []), ...uploadedUrls]);
                                if (uploadedUrls.length) {
                                  toast({
                                    title: 'Images Uploaded',
                                    description: `${uploadedUrls.length} image(s) uploaded successfully!`,
                                  });
                                }
                              } finally {
                                setUploading(false);
                              }
                            }}
                          />
                          {/* Show previews and allow removal */}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {(field.value || []).map((url: string, idx: number) => (
                              <div key={url} className="relative group">
                                <img src={url} alt={`Event ${idx + 1}`} className="max-h-24 rounded border" />
                                <button
                                  type="button"
                                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 text-xs opacity-80 group-hover:opacity-100"
                                  onClick={() => {
                                    const newImages = field.value.filter((_: string, i: number) => i !== idx);
                                    field.onChange(newImages);
                                  }}
                                  aria-label="Remove image"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                          {uploading && <div className="text-xs text-blue-600 mt-1">Uploading...</div>}
                        </>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>Venue</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
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
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
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
                      <FormLabel>Duration (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="host"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Host</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="event_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Type</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select an event type" />
                          </SelectTrigger>
                          <SelectContent>
                            {eventTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="has_discount"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Event has discount?</FormLabel>
                      <FormControl>
                        <input type="checkbox" checked={field.value} onChange={e => field.onChange(e.target.checked)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_private"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 col-span-2">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Private Event</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          When enabled, only invited users can view this event
                        </p>
                      </div>
                      <FormControl>
                        <div className={`relative inline-block w-16 h-8 align-middle select-none`}>
                          <input
                            type="checkbox"
                            id="private-toggle"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className={`absolute block w-8 h-8 rounded-full bg-white border-4 appearance-none cursor-pointer z-10 transition-all duration-300 ease-in-out transform ${
                              field.value 
                                ? 'right-0 border-yellow-400 translate-x-1/2' 
                                : 'left-0 border-red-500 -translate-x-1/2'
                            }`}
                          />
                          <div 
                            className={`toggle-label block w-full h-full rounded-full transition-colors duration-300 ease-in-out ${
                              field.value ? 'bg-yellow-100' : 'bg-red-100'
                            }`}
                          ></div>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                 />
                
                 {/* Show invitation form for private events */}
                 {form.watch("is_private") && isEditing && initialData?.id && (
                   <div className="col-span-2">
                     <div className="text-center text-muted-foreground">
                       Invitation management will be available after event creation.
                     </div>
                   </div>
                 )}

                {form.watch("has_discount") && (
                  <>
                    <FormField
                      control={form.control}
                      name="real_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Real Price</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="discounted_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discounted Price</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                <FormField
                  control={form.control}
                  name="base_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Price</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step={1} {...field} onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} />
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
                      <FormLabel>GST</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step={1} {...field} onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="convenience_fee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Convenience Fee</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step={1} {...field} onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} />
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
                      <FormLabel>Subtotal</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step={1} {...field} onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ticket_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ticket Price</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step={1} {...field} onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Google Maps Location Link */}
                <FormField
                  control={form.control}
                  name="location_map_link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Google Maps Link</FormLabel>
                      <FormControl>
                        <Input type="url" placeholder="https://maps.google.com/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Seats Available */}
                <FormField
                  control={form.control}
                  name="seats_available"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seats Available</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0} 
                          {...field} 
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Event Timing Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Event Timing</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="doors_open_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Doors Open Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="show_start_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Show Start Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Location & Transportation Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Location & Transportation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="nearest_station"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nearest Station</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Metro Station, Bus Stop" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="parking_info"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parking Information</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Parking details, charges, availability..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address_reveal_note"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Reveal Note</FormLabel>
                        <FormControl>
                          <Textarea placeholder="When and how will the address be revealed?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="late_arrival_note"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Late Arrival Note</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Policy for late arrivals..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Event Amenities Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Event Amenities</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="alcohol_available"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Alcohol Available</FormLabel>
                          <p className="text-sm text-muted-foreground">
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
                    name="bar_available"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Bar Available</FormLabel>
                          <p className="text-sm text-muted-foreground">
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
                    name="food_policy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Food Policy</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Food policy, outside food allowed, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="seating_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seating Type</FormLabel>
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
                    name="indoor_outdoor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Indoor/Outdoor</FormLabel>
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
                <h3 className="text-lg font-semibold text-gray-900">Accessibility & Additional Information</h3>
                <div className="grid grid-cols-1 gap-6">
                  <FormField
                    control={form.control}
                    name="accessibility_info"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Accessibility Information</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Wheelchair access, special accommodations, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="additional_info"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Information</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Any other important information for attendees..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Custom Tags & Details Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Custom Tags & Details</h3>
                <div className="space-y-3">
                  {customTags.length === 0 && (
                    <div className="text-sm text-muted-foreground">No custom details added yet.</div>
                  )}
                  {customTags.map((ct, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-start">
                      <div>
                        <label className="text-sm font-medium">Tag</label>
                        <Input
                          value={ct.tag}
                          onChange={(e) => {
                            const next = [...customTags];
                            next[index] = { ...next[index], tag: e.target.value };
                            setCustomTags(next);
                            form.setValue("custom_tags", next as any);
                          }}
                          placeholder="e.g., policy, link, note"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Heading/Label</label>
                        <Input
                          value={ct.label}
                          onChange={(e) => {
                            const next = [...customTags];
                            next[index] = { ...next[index], label: e.target.value };
                            setCustomTags(next);
                            form.setValue("custom_tags", next as any);
                          }}
                          placeholder="e.g., Refund Policy"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Details</label>
                        <Input
                          value={ct.value}
                          onChange={(e) => {
                            const next = [...customTags];
                            next[index] = { ...next[index], value: e.target.value };
                            setCustomTags(next);
                            form.setValue("custom_tags", next as any);
                          }}
                          placeholder="Write details or text"
                        />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-sm font-medium">Link (optional)</label>
                          <Input
                            value={ct.link || ""}
                            onChange={(e) => {
                              const next = [...customTags];
                              next[index] = { ...next[index], link: e.target.value || null };
                              setCustomTags(next);
                              form.setValue("custom_tags", next as any);
                            }}
                            placeholder="https://..."
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => {
                            const next = customTags.filter((_, i) => i !== index);
                            setCustomTags(next);
                            form.setValue("custom_tags", next as any);
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
                      form.setValue("custom_tags", next as any);
                    }}
                  >
                    Add Tag
                  </Button>
                </div>
              </div>

              {/* Event Offers Section */}
              <div className="col-span-2">
                <EventOffersManager
                  eventId={initialData?.id || "new"}
                  offers={eventOffers}
                  onOffersChange={(offers: EventOffer[]) => {
                    setEventOffers(offers);
                    form.setValue("offers", offers);
                  }}
                />
              </div>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : isEditing ? "Update Event" : "Create Event"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </CardYellowContainer>
  );
}