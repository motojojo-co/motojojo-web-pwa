import { supabase } from "@/integrations/supabase/client";
import { Event } from "./eventService";

// Interface to create an event (matches database fields)
export interface CreateEventInput {
  title: string;
  subtitle?: string;
  description: string;
  long_description?: string;
  date: string;
  time: string;
  duration?: string;
  venue: string;
  city: string;
  address?: string;
  price: number;
  image: string;
  images?: string[]; // <-- new field for multiple images
  category: string;
  event_type?: string;
  host?: string;
  is_published?: boolean;
  has_discount?: boolean;
  real_price?: number | null;
  discounted_price?: number | null;
  base_price?: number;
  gst?: number;
  convenience_fee?: number;
  subtotal?: number;
  ticket_price?: number;
  location_map_link?: string;
  offers?: any[];
}

export const createEvent = async (eventData: CreateEventInput) => {
  try {
    // If images array is provided, set image to the first image and include images array
    let dataToInsert: any = { ...eventData };
    if (eventData.images && eventData.images.length > 0) {
      dataToInsert.image = eventData.images[0];
      dataToInsert.images = eventData.images;
    }
    
    // Insert event with offers included
    const { data, error } = await supabase
      .from('events')
      .insert(dataToInsert)
      .select('*')
      .single();

    if (error) {
      console.error("Error creating event:", error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error("Error in createEvent:", error);
    throw error;
  }
};

export const updateEvent = async (id: string, eventData: Partial<CreateEventInput>) => {
  try {
    // If images array is provided, set image to the first image and include images array
    let dataToUpdate: any = { ...eventData };
    if (eventData.images && eventData.images.length > 0) {
      dataToUpdate.image = eventData.images[0];
      dataToUpdate.images = eventData.images;
    }
    
    // Update event with offers included
    const { data, error } = await supabase
      .from('events')
      .update(dataToUpdate)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error("Error updating event:", error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error("Error in updateEvent:", error);
    throw error;
  }
};

export const deleteEvent = async (id: string) => {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Error deleting event:", error);
    throw error;
  }
};

export const subscribeToEvents = (callback: (event: Event) => void) => {
  const channel = supabase
    .channel('events-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'events'
      },
      (payload) => {
        // Transform the payload to match the Event interface
        const newEvent = payload.new as any;
        const transformedEvent: Event = {
          id: newEvent.id,
          title: newEvent.title,
          subtitle: newEvent.subtitle || undefined,
          description: newEvent.description,
          date: newEvent.date,
          time: newEvent.time,
          category: newEvent.category,
          venue: newEvent.venue,
          city: newEvent.city,
          address: '', // Default value
          price: newEvent.price,
          image: newEvent.image,
          gallery: [], // Default value
          featured: false, // Default value
          created_by: '', // Default value
          is_published: true, // Default value
          created_at: newEvent.created_at,
          event_type: newEvent.event_type,
          host: newEvent.host || undefined,
          duration: newEvent.duration || undefined,
          long_description: newEvent.long_description || null,
          updated_at: newEvent.updated_at
        };
        callback(transformedEvent);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
