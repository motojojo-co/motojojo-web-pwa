import { supabase } from "@/integrations/supabase/client";

export interface EventOffer {
  id: string;
  event_id: string;
  offer_type: 'razorpay_above' | 'add_person' | 'group_discount' | 'no_stag' | 'student_discount' | 'flat_rate' | 'women_flash_sale';
  title: string;
  description?: string;
  price_adjustment: number;
  min_quantity: number;
  max_quantity?: number;
  group_size: number;
  conditions: Record<string, any>;
  is_active: boolean;
  valid_from: string;
  valid_until?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEventOfferData {
  event_id: string;
  offer_type: EventOffer['offer_type'];
  title: string;
  description?: string;
  price_adjustment: number;
  min_quantity: number;
  max_quantity?: number;
  group_size: number;
  conditions?: Record<string, any>;
  is_active?: boolean;
  valid_from?: string;
  valid_until?: string;
}

export interface UpdateEventOfferData extends Partial<CreateEventOfferData> {
  id: string;
}

// Get all offers for a specific event
export const getEventOffers = async (eventId: string): Promise<EventOffer[]> => {
  const { data, error } = await supabase
    .from("event_offers")
    .select("*")
    .eq("event_id", eventId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching event offers:", error);
    throw new Error("Failed to fetch event offers");
  }

  return data || [];
};

// Get all offers (admin only)
export const getAllEventOffers = async (): Promise<EventOffer[]> => {
  const { data, error } = await supabase
    .from("event_offers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching all event offers:", error);
    throw new Error("Failed to fetch all event offers");
  }

  return data || [];
};

// Create a new offer
export const createEventOffer = async (offerData: CreateEventOfferData): Promise<EventOffer> => {
  const { data, error } = await supabase
    .from("event_offers")
    .insert([offerData])
    .select()
    .single();

  if (error) {
    console.error("Error creating event offer:", error);
    throw new Error("Failed to create event offer");
  }

  return data;
};

// Update an existing offer
export const updateEventOffer = async (offerData: UpdateEventOfferData): Promise<EventOffer> => {
  const { id, ...updateData } = offerData;
  
  const { data, error } = await supabase
    .from("event_offers")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating event offer:", error);
    throw new Error("Failed to update event offer");
  }

  return data;
};

// Delete an offer
export const deleteEventOffer = async (offerId: string): Promise<void> => {
  const { error } = await supabase
    .from("event_offers")
    .delete()
    .eq("id", offerId);

  if (error) {
    console.error("Error deleting event offer:", error);
    throw new Error("Failed to delete event offer");
  }
};

// Toggle offer active status
export const toggleOfferStatus = async (offerId: string, isActive: boolean): Promise<EventOffer> => {
  const { data, error } = await supabase
    .from("event_offers")
    .update({ is_active: isActive })
    .eq("id", offerId)
    .select()
    .single();

  if (error) {
    console.error("Error toggling offer status:", error);
    throw new Error("Failed to toggle offer status");
  }

  return data;
};

// Get offers by type
export const getOffersByType = async (eventId: string, offerType: EventOffer['offer_type']): Promise<EventOffer[]> => {
  const { data, error } = await supabase
    .from("event_offers")
    .select("*")
    .eq("event_id", eventId)
    .eq("offer_type", offerType)
    .eq("is_active", true);

  if (error) {
    console.error("Error fetching offers by type:", error);
    throw new Error("Failed to fetch offers by type");
  }

  return data || [];
};

