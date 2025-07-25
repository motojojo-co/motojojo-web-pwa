import { supabase } from "@/integrations/supabase/client";

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
  images?: string[]; // <-- add this for multi-image support
  gallery: string[];
  featured: boolean;
  created_by: string;
  is_published: boolean;
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
}

export const getAllEvents = async (): Promise<Event[]> => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true });
    
  if (error) console.error('Error fetching events:', error);
  
  const events = data || [];
  return events.map(event => ({
    id: event.id,
    title: event.title,
    subtitle: event.subtitle || undefined,
    description: event.description,
    date: event.date,
    time: event.time,
    category: event.category,
    venue: event.venue,
    city: event.city,
    address: '', // Default value
    price: event.price,
    image: event.image,
    images: event.images || [], // <-- add this line
    gallery: [], // Default value
    featured: false, // Default value
    created_by: '', // Default value
    is_published: true, // Default value
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

export const getEvents = async (filters?: { city?: string; eventType?: string }): Promise<Event[]> => {
  let query = supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true });
    
  // Apply filters if provided
  if (filters) {
    if (filters.city) {
      query = query.eq('city', filters.city);
    }
    
    if (filters.eventType) {
      query = query.eq('event_type', filters.eventType);
    }
  }
  
  const { data, error } = await query;
    
  if (error) console.error("Error fetching events:", error);
  
  // Transform data to match the Event interface
  const events = data || [];
  return events.map(event => ({
    id: event.id,
    title: event.title,
    subtitle: event.subtitle || undefined,
    description: event.description,
    date: event.date,
    time: event.time,
    category: event.category,
    venue: event.venue,
    city: event.city,
    address: '', // Default value for missing field
    price: event.price,
    image: event.image,
    images: event.images || [], // <-- add this line
    gallery: [], // Default value for missing field
    featured: false, // Default value for missing field
    created_by: '', // Default value for missing field
    is_published: true, // Default value for missing field
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

// Get unique cities from events
export const getEventCities = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('events')
    .select('city')
    .order('city');
    
  if (error) {
    console.error("Error fetching event cities:", error);
    return [];
  }
  
  // Extract unique cities
  const cities = new Set(data.map(item => item.city));
  return Array.from(cities);
};

// Get unique event dates for filtering
export const getEventDates = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('events')
    .select('date');
  if (error) {
    console.error("Error fetching event dates:", error);
    return [];
  }
  // Extract unique dates
  const dates = new Set(data.map(item => item.date));
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

export const getEventsByCategory = async (categoryId: string): Promise<Event[]> => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('category', categoryId)
    .order('date', { ascending: true });
    
  if (error) console.error(`Error fetching events for category ${categoryId}:`, error);
  
  const events = data || [];
  return events.map(event => ({
    id: event.id,
    title: event.title,
    subtitle: event.subtitle || undefined,
    description: event.description,
    date: event.date,
    time: event.time,
    category: event.category,
    venue: event.venue,
    city: event.city,
    address: '', // Default value
    price: event.price,
    image: event.image,
    images: event.images || [], // <-- add this line
    gallery: [], // Default value
    featured: false, // Default value
    created_by: '', // Default value
    is_published: true, // Default value
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
    .from('events')
    .select('*')
    .eq('id', id)
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
    address: '', // Default value
    price: data.price,
    image: data.image,
    images: data.images || [], // <-- add this line
    gallery: [], // Default value
    featured: false, // Default value
    created_by: '', // Default value
    is_published: true, // Default value
    created_at: data.created_at,
    event_type: data.event_type,
    host: data.host || undefined,
    duration: data.duration || undefined,
    long_description: data.long_description || null,
    updated_at: data.updated_at,
    has_discount: data.has_discount ?? false,
    real_price: data.real_price ?? null,
    discounted_price: data.discounted_price ?? null,
    base_price: data.base_price ?? 0,
    gst: data.gst ?? 0,
    convenience_fee: data.convenience_fee ?? 0,
    subtotal: data.subtotal ?? 0,
    ticket_price: data.ticket_price ?? 0,
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
    city: event.city
  };
};
