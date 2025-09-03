import { EventOffer } from "@/services/eventOfferService";

export interface OfferCalculation {
  basePrice: number;
  adjustedPrice: number;
  savings: number;
  appliedOffers: EventOffer[];
  totalPrice: number;
}

export interface BookingContext {
  quantity: number;
  isStudent?: boolean;
  isWomen?: boolean;
  isGroupBooking?: boolean;
  hasStudentId?: boolean;
  bookingDay?: string; // e.g., 'friday'
  bookingTime?: string; // e.g., '14:00'
}

export const calculateOfferPricing = (
  basePrice: number,
  offers: EventOffer[],
  context: BookingContext
): OfferCalculation => {
  let totalPrice = basePrice * context.quantity;
  let totalSavings = 0;
  const appliedOffers: EventOffer[] = [];

  // Sort offers by priority (flat_rate first, then others)
  const sortedOffers = [...offers].sort((a, b) => {
    if (a.offer_type === 'flat_rate') return -1;
    if (b.offer_type === 'flat_rate') return 1;
    return 0;
  });

  for (const offer of sortedOffers) {
    if (!isOfferCurrentlyValid(offer, context)) continue;

    let offerSavings = 0;
    let offerAdjustment = 0;

    switch (offer.offer_type) {
      case 'flat_rate':
        // Flat rate replaces the base price
        offerAdjustment = (offer.price_adjustment - basePrice) * context.quantity;
        offerSavings = basePrice * context.quantity - offer.price_adjustment * context.quantity;
        break;

      case 'add_person':
        // Add person offer - additional cost per person beyond group size
        if (context.quantity >= offer.group_size) {
          const additionalPeople = context.quantity - offer.group_size + 1;
          offerAdjustment = offer.price_adjustment * additionalPeople;
          totalPrice += offerAdjustment;
        }
        break;

      case 'group_discount':
        // Group discount - reduced price for groups
        if (context.quantity >= offer.group_size) {
          const discountPerTicket = basePrice - offer.price_adjustment;
          offerSavings = discountPerTicket * context.quantity;
          totalPrice -= offerSavings;
        }
        break;

      case 'student_discount':
        // Student discount - reduced price for students
        if (context.isStudent && context.hasStudentId) {
          const discountPerTicket = basePrice - offer.price_adjustment;
          offerSavings = discountPerTicket * context.quantity;
          totalPrice -= offerSavings;
        }
        break;

      case 'women_flash_sale':
        // Women flash sale - special pricing for women on specific days
        if (context.isWomen && context.bookingDay === 'friday' && context.quantity === 1) {
          const discountPerTicket = basePrice - offer.price_adjustment;
          offerSavings = discountPerTicket * context.quantity;
          totalPrice -= offerSavings;
        }
        break;

      case 'no_stag':
        // No stag - requires group booking
        if (context.quantity > 1) {
          // This is more of a validation rule than a pricing rule
          // Could apply small discount for group bookings
          offerSavings = 0;
        }
        break;

      case 'razorpay_above':
        // Razorpay fee - additional payment processing fee
        offerAdjustment = offer.price_adjustment * context.quantity;
        totalPrice += offerAdjustment;
        break;

      default:
        continue;
    }

    if (offerSavings > 0 || offerAdjustment !== 0) {
      appliedOffers.push(offer);
      totalSavings += offerSavings;
    }
  }

  const adjustedPrice = totalPrice / context.quantity;

  return {
    basePrice,
    adjustedPrice: Math.max(0, adjustedPrice),
    savings: Math.max(0, totalSavings),
    appliedOffers,
    totalPrice: Math.max(0, totalPrice)
  };
};

export const getOfferDisplayText = (offer: EventOffer): string => {
  switch (offer.offer_type) {
    case 'flat_rate':
      return `Flat rate: ₹${offer.price_adjustment}`;
    case 'add_person':
      return `+₹${offer.price_adjustment} per additional person`;
    case 'group_discount':
      return `₹${offer.price_adjustment} for groups of ${offer.group_size}+`;
    case 'student_discount':
      return `Student price: ₹${offer.price_adjustment}`;
    case 'women_flash_sale':
      return `Women special: ₹${offer.price_adjustment}`;
    case 'no_stag':
      return 'Group booking required';
    case 'razorpay_above':
      return `+₹${offer.price_adjustment} payment fee`;
    default:
      return 'Special offer';
  }
};

export const isOfferCurrentlyValid = (offer: EventOffer, context: BookingContext): boolean => {
  // Check if offer is active
  if (!offer.is_active) return false;

  // Check quantity requirements
  if (context.quantity < offer.min_quantity) return false;
  if (offer.max_quantity && context.quantity > offer.max_quantity) return false;

  // Check group size requirements
  if (offer.group_size > 1 && context.quantity < offer.group_size) return false;

  // Check validity dates
  const now = new Date();
  const validFrom = new Date(offer.valid_from);
  if (now < validFrom) return false;

  if (offer.valid_until) {
    const validUntil = new Date(offer.valid_until);
    if (now > validUntil) return false;
  }

  // Check specific offer type requirements
  switch (offer.offer_type) {
    case 'student_discount':
      return context.isStudent === true && context.hasStudentId === true;
    
    case 'women_flash_sale':
      return context.isWomen === true && 
             context.bookingDay === 'friday' && 
             context.quantity === 1;
    
    case 'no_stag':
      return context.quantity > 1;
    
    case 'add_person':
      return context.quantity >= offer.group_size;
    
    case 'group_discount':
      return context.quantity >= offer.group_size;
    
    default:
      return true;
  }
};

export const getEligibleOffers = (offers: EventOffer[], context: BookingContext): EventOffer[] => {
  return offers.filter(offer => isOfferCurrentlyValid(offer, context));
};

export const getBestOfferCombination = (
  offers: EventOffer[],
  context: BookingContext
): EventOffer[] => {
  const eligibleOffers = getEligibleOffers(offers, context);
  
  // For now, return all eligible offers
  // In the future, this could implement more sophisticated logic
  // to find the best combination of offers
  return eligibleOffers;
};
