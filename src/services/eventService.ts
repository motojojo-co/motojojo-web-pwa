import { supabase } from "@/integrations/supabase/client";
import { EventOffer } from "./eventOfferService";

export interface Event {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  long_description?: string | null;
  date: string;
  time: string;
  duration?: string;
  category: string;
  venue: string;
  city: string;
  address: string;
  price: number;
  image: string;
  images: string[]; // For multi-image support
  gallery: string[];
  featured: boolean;
  created_by: string;
  is_published: boolean;
  is_private: boolean; // Field for private events
  created_at: string;
  event_type?: string;
  host?: string;
  updated_at?: string;
  has_discount?: boolean;
  real_price?: number | null;
  discounted_price?: number | null;
  base_price?: number;
  gst?: number;
  convenience_fee?: number;
  subtotal?: number;
  ticket_price?: number;
  location_map_link?: string; // Google Maps link for the event location
  offers?: EventOffer[]; // Event offers
  seats_available?: number;
  // New timing fields
  doors_open_time?: string | null;
  show_start_time?: string | null;
  // New location fields
  nearest_station?: string | null;
  address_reveal_note?: string | null;
  late_arrival_note?: string | null;
  // New amenities fields
  alcohol_available?: boolean;
  bar_available?: boolean;
  food_policy?: string | null;
  seating_type?: string | null;
  indoor_outdoor?: string | null;
  // New info fields
  accessibility_info?: string | null;
  parking_info?: string | null;
  additional_info?: string | null;
}

export const getAllEvents = async (): Promise<Event[]> => {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("is_private", false) // Only get public events
    .eq("is_published", true)
    .order("date", { ascending: true });

  if (error) console.error("Error fetching events:", error);

  const events = data || [];
  return events.map((event) => ({
    id: event.id,
    title: event.title,
    subtitle: event.subtitle || undefined,
    description: event.description,
    date: event.date,
    time: event.time,
    category: event.category,
    venue: event.venue,
    city: event.city,
    address: event.address || "",
    price: event.price,
    image: event.image,
    images: event.images || [],
    gallery: [], // Default value since gallery field doesn't exist in DB
    featured: false, // Default value since featured field doesn't exist in DB
    created_by: "", // Default value since created_by field doesn't exist in DB
    is_published: event.is_published !== undefined ? event.is_published : true,
    is_private: event.is_private || false,
    created_at: event.created_at,
    event_type: event.event_type,
    host: event.host || undefined,
    duration: event.duration || undefined,
    long_description: event.long_description || null,
    updated_at: event.updated_at,
    has_discount: event.has_discount ?? false,
    real_price: event.real_price ?? null,
    discounted_price: event.discounted_price ?? null,
    base_price: event.base_price ?? 0,
    gst: event.gst ?? 0,
    convenience_fee: event.convenience_fee ?? 0,
    subtotal: event.subtotal ?? 0,
    ticket_price: event.ticket_price ?? 0,
    location_map_link: event.location_map_link || undefined,
  }));
};

// Get all private, published events (for public listing on InviteOnly page)
export const getAllPrivateEvents = async (): Promise<Event[]> => {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("is_private", true)
    .eq("is_published", true)
    .order("date", { ascending: true });

  if (error) {
    console.error("Error fetching private events:", error);
  }

  const events = data || [];
  return events.map((event) => ({
    id: event.id,
    title: event.title,
    subtitle: event.subtitle || undefined,
    description: event.description,
    date: event.date,
    time: event.time,
    category: event.category,
    venue: event.venue,
    city: event.city,
    address: event.address || "",
    price: event.price,
    image: event.image,
    images: event.images || [],
    gallery: [],
    featured: false,
    created_by: "",
    is_published: event.is_published !== undefined ? event.is_published : true,
    is_private: event.is_private || true,
    created_at: event.created_at,
    event_type: event.event_type,
    host: event.host || undefined,
    duration: event.duration || undefined,
    long_description: event.long_description || null,
    updated_at: event.updated_at,
    has_discount: event.has_discount ?? false,
    real_price: event.real_price ?? null,
    discounted_price: event.discounted_price ?? null,
    base_price: event.base_price ?? 0,
    gst: event.gst ?? 0,
    convenience_fee: event.convenience_fee ?? 0,
    subtotal: event.subtotal ?? 0,
    ticket_price: event.ticket_price ?? 0,
    location_map_link: event.location_map_link || undefined,
  }));
};

export const getEvents = async (filters?: {
  city?: string;
  eventType?: string;
}): Promise<Event[]> => {
  let query = supabase
    .from("events")
    .select("*")
    .eq("is_private", false) // Only get public events
    .eq("is_published", true)
    .order("date", { ascending: true });

  // Apply filters if provided
  if (filters) {
    if (filters.city) {
      query = query.eq("city", filters.city);
    }

    if (filters.eventType) {
      query = query.eq("event_type", filters.eventType);
    }
  }

  const { data, error } = await query;

  if (error) console.error("Error fetching events:", error);

  // Transform data to match the Event interface
  const events = data || [];
  return events.map((event) => ({
    id: event.id,
    title: event.title,
    subtitle: event.subtitle || undefined,
    description: event.description,
    date: event.date,
    time: event.time,
    category: event.category,
    venue: event.venue,
    city: event.city,
    address: event.address || "",
    price: event.price,
    image: event.image,
    images: event.images || [],
    gallery: [], // Default value since gallery field doesn't exist in DB
    featured: false, // Default value since featured field doesn't exist in DB
    created_by: "", // Default value since created_by field doesn't exist in DB
    is_published: event.is_published !== undefined ? event.is_published : true,
    is_private: event.is_private || false,
    created_at: event.created_at,
    event_type: event.event_type,
    host: event.host || undefined,
    duration: event.duration || undefined,
    long_description: event.long_description || null,
    updated_at: event.updated_at,
    has_discount: event.has_discount ?? false,
    real_price: event.real_price ?? null,
    discounted_price: event.discounted_price ?? null,
    base_price: event.base_price ?? 0,
    gst: event.gst ?? 0,
    convenience_fee: event.convenience_fee ?? 0,
    subtotal: event.subtotal ?? 0,
    ticket_price: event.ticket_price ?? 0,
    location_map_link: event.location_map_link || undefined,
  }));
};

// Get unique cities from events
export const getEventCities = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from("events")
    .select("city")
    .order("city");

  if (error) {
    console.error("Error fetching event cities:", error);
    return [];
  }

  // Extract unique cities
  const cities = new Set(data.map((item) => item.city));
  return Array.from(cities);
};

// Get unique event dates for filtering
export const getEventDates = async (): Promise<string[]> => {
  const { data, error } = await supabase.from("events").select("date");
  if (error) {
    console.error("Error fetching event dates:", error);
    return [];
  }
  // Extract unique dates
  const dates = new Set(data.map((item) => item.date));
  return Array.from(dates).sort();
};

// Get events by city
export const getEventsByCity = async (city: string): Promise<Event[]> => {
  return getEvents({ city });
};

// Get events by event type
export const getEventsByType = async (eventType: string): Promise<Event[]> => {
  return getEvents({ eventType });
};

// export const getFeaturedEvents = async (): Promise<Event[]> => {
//   // Since 'featured' field might not exist in the table, we'll fetch all events
//   // and return the first few as featured (mock implementation)
//   const { data, error } = await supabase
//     .from('events')
//     .select('*')
//     .order('date', { ascending: true })
//     .limit(3); // Limiting to 3 events as featured

//   if (error) console.error("Error fetching featured events:", error);

//   const events = data || [];
//   return events.map(event => ({
//     id: event.id,
//     title: event.title,
//     subtitle: event.subtitle || undefined,
//     description: event.description,
//     date: event.date,
//     time: event.time,
//     category: event.category,
//     venue: event.venue,
//     city: event.city,
//     address: '', // Default value
//     price: event.price,
//     image: event.image,
//     gallery: [], // Default value
//     featured: true, // Set as featured
//     created_by: '', // Default value
//     is_published: true, // Default value
//     created_at: event.created_at,
//     event_type: event.event_type,
//     host: event.host || undefined,
//     duration: event.duration || undefined,
//     long_description: event.long_description || null,
//     updated_at: event.updated_at,
//     has_discount: event.has_discount ?? false,
//     real_price: event.real_price ?? null,
//     discounted_price: event.discounted_price ?? null,
//   }));
// };

export const getEventsByCategory = async (
  categoryId: string
): Promise<Event[]> => {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("category", categoryId)
    .order("date", { ascending: true });

  if (error)
    console.error(`Error fetching events for category ${categoryId}:`, error);

  const events = data || [];
  return events.map((event) => ({
    id: event.id,
    title: event.title,
    subtitle: event.subtitle || undefined,
    description: event.description,
    date: event.date,
    time: event.time,
    category: event.category,
    venue: event.venue,
    city: event.city,
    address: event.address || "",
    price: event.price,
    image: event.image,
    images: event.images || [],
    gallery: [], // Default value since gallery field doesn't exist in DB
    featured: false, // Default value since featured field doesn't exist in DB
    created_by: "", // Default value since created_by field doesn't exist in DB
    is_published: event.is_published !== undefined ? event.is_published : true,
    is_private: event.is_private || false,
    created_at: event.created_at,
    event_type: event.event_type,
    host: event.host || undefined,
    duration: event.duration || undefined,
    long_description: event.long_description || null,
    updated_at: event.updated_at,
    has_discount: event.has_discount ?? false,
    real_price: event.real_price ?? null,
    discounted_price: event.discounted_price ?? null,
    base_price: event.base_price ?? 0,
    gst: event.gst ?? 0,
    convenience_fee: event.convenience_fee ?? 0,
    subtotal: event.subtotal ?? 0,
    ticket_price: event.ticket_price ?? 0,
  }));
};

export const getEvent = async (id: string): Promise<Event | null> => {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching event ${id}:`, error);
    return null;
  }

  if (!data) return null;

  return {
    id: data.id,
    title: data.title,
    subtitle: data.subtitle || undefined,
    description: data.description,
    date: data.date,
    time: data.time,
    category: data.category,
    venue: data.venue,
    city: data.city,
    address: data.address || "",
    price: data.price,
    image: data.image,
    images: data.images || undefined,
    gallery: [], // Default value since gallery field doesn't exist in DB
    featured: false, // Default value since featured field doesn't exist in DB
    created_by: "", // Default value since created_by field doesn't exist in DB
    is_published: data.is_published !== undefined ? data.is_published : true,
    is_private: data.is_private || false,
    created_at: data.created_at,
    event_type: data.event_type,
    host: data.host || undefined,
    duration: data.duration || undefined,
    long_description: data.long_description || null,
    updated_at: data.updated_at,
    has_discount: data.has_discount ?? false,
    real_price: data.real_price ?? null,
    discounted_price: data.discounted_price ?? null,
    base_price:
      typeof data.base_price === "number" ? data.base_price : undefined,
    gst: typeof data.gst === "number" ? data.gst : undefined,
    convenience_fee:
      typeof data.convenience_fee === "number"
        ? data.convenience_fee
        : undefined,
    subtotal: typeof data.subtotal === "number" ? data.subtotal : undefined,
    ticket_price:
      typeof data.ticket_price === "number" ? data.ticket_price : undefined,
    location_map_link:
      typeof data.location_map_link === "string"
        ? data.location_map_link
        : undefined,
    offers: data.offers || [],
    seats_available: data.seats_available || 100,
    // New timing fields
    doors_open_time: data.doors_open_time || null,
    show_start_time: data.show_start_time || null,
    // New location fields
    nearest_station: data.nearest_station || null,
    address_reveal_note: data.address_reveal_note || null,
    late_arrival_note: data.late_arrival_note || null,
    // New amenities fields
    alcohol_available: data.alcohol_available || false,
    bar_available: data.bar_available || false,
    food_policy: data.food_policy || null,
    seating_type: data.seating_type || null,
    indoor_outdoor: data.indoor_outdoor || null,
    // New info fields
    accessibility_info: data.accessibility_info || null,
    parking_info: data.parking_info || null,
    additional_info: data.additional_info || null,
  };
};

// Alias for getEvent to maintain backwards compatibility
export const getEventById = getEvent;

export const addToCart = (event: Event, quantity: number = 1) => {
  return {
    id: crypto.randomUUID(),
    eventId: event.id,
    eventTitle: event.title,
    eventImage: event.image,
    quantity,
    price: event.price,
    date: event.date,
    venue: event.venue,
    city: event.city,
  };
};

// Get private events for current user based on invitations
export const getPrivateEventsForUser = async (): Promise<Event[]> => {
  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("User not authenticated:", userError);
      return [];
    }

    // Get user's email from auth user or users table
    const userEmail = user.email;
    if (!userEmail) {
      console.error("User email not found");
      return [];
    }

    // Get events user is invited to
    const { data: invitations, error: invitationsError } = await supabase
      .from("event_invitations")
      .select("event_id")
      .eq("user_email", userEmail)
      .eq("status", "pending"); // Include pending invitations

    if (invitationsError) {
      console.error("Error fetching invitations:", invitationsError);
      return [];
    }

    if (!invitations || invitations.length === 0) {
      return [];
    }

    // Get the actual events
    const eventIds = invitations.map((inv) => inv.event_id);
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("*")
      .in("id", eventIds)
      .eq("is_private", true)
      .eq("is_published", true)
      .order("date", { ascending: true });

    if (eventsError) {
      console.error("Error fetching private events:", eventsError);
      return [];
    }

    const eventData = events || [];
    return eventData.map((event) => ({
      id: event.id,
      title: event.title,
      subtitle: event.subtitle || undefined,
      description: event.description,
      date: event.date,
      time: event.time,
      category: event.category,
      venue: event.venue,
      city: event.city,
      address: event.address || "",
      price: event.price,
      image: event.image,
      images: event.images || [],
      gallery: [], // Default value since gallery field doesn't exist in DB
      featured: false, // Default value since featured field doesn't exist in DB
      created_by: "", // Default value since created_by field doesn't exist in DB
      is_published:
        event.is_published !== undefined ? event.is_published : true,
      is_private: event.is_private || false,
      created_at: event.created_at,
      event_type: event.event_type,
      host: event.host || undefined,
      duration: event.duration || undefined,
      long_description: event.long_description || null,
      updated_at: event.updated_at,
      has_discount: event.has_discount ?? false,
      real_price: event.real_price ?? null,
      discounted_price: event.discounted_price ?? null,
      base_price: event.base_price ?? 0,
      gst: event.gst ?? 0,
      convenience_fee: event.convenience_fee ?? 0,
      subtotal: event.subtotal ?? 0,
      ticket_price: event.ticket_price ?? 0,
      location_map_link: event.location_map_link || undefined,
    }));
  } catch (error) {
    console.error("Error in getPrivateEventsForUser:", error);
    return [];
  }
};

// Get all events for admin dashboard (including private and unpublished events with offers)
export const getAdminEvents = async (): Promise<Event[]> => {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("date", { ascending: true });

  if (error) {
    console.error("Error fetching admin events:", error);
    throw new Error("Failed to fetch admin events");
  }

  // Transform data to match the Event interface
  const events = data || [];
  return events.map((event) => ({
    id: event.id,
    title: event.title,
    subtitle: event.subtitle || undefined,
    description: event.description,
    date: event.date,
    time: event.time,
    category: event.category,
    venue: event.venue,
    city: event.city,
    address: event.address || "",
    price: event.price,
    image: event.image,
    images: event.images || [],
    gallery: [], // Default value since gallery field doesn't exist in DB
    featured: false, // Default value since featured field doesn't exist in DB
    created_by: "", // Default value since created_by field doesn't exist in DB
    is_published: event.is_published !== undefined ? event.is_published : true,
    is_private: event.is_private || false,
    created_at: event.created_at,
    event_type: event.event_type,
    host: event.host || undefined,
    duration: event.duration || undefined,
    long_description: event.long_description || null,
    updated_at: event.updated_at,
    has_discount: event.has_discount ?? false,
    real_price: event.real_price ?? null,
    discounted_price: event.discounted_price ?? null,
    base_price: event.base_price ?? 0,
    gst: event.gst ?? 0,
    convenience_fee: event.convenience_fee ?? 0,
    subtotal: event.subtotal ?? 0,
    ticket_price: event.ticket_price ?? 0,
    location_map_link: event.location_map_link || undefined,
    offers: event.offers || [], // Include offers from the database
  }));
};
