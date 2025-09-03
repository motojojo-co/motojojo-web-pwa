import React, { useState, useEffect } from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface OfferSelectionProps {
  event: any;
  basePrice: number;
  quantity: number;
  onPricingChange: (pricing: any) => void;
}

export default function OfferSelection({ 
  event, 
  basePrice, 
  quantity, 
  onPricingChange 
}: OfferSelectionProps) {
  console.log('🔍 OfferSelection component loaded with:', { 
    event: event?.title, 
    basePrice, 
    quantity, 
    hasOffers: !!event?.offers,
    offersCount: event?.offers?.length || 0
  });

  const [selectedOffers, setSelectedOffers] = useState<string[]>([]);

  // Calculate pricing based on selected offers
  const calculatePricing = () => {
    if (!event?.offers || selectedOffers.length === 0) {
      return {
        basePrice,
        totalPrice: basePrice * quantity,
        appliedOffers: [],
        savings: 0,
        adjustments: []
      };
    }

    let totalPrice = basePrice * quantity;
    const appliedOffers = event.offers.filter((offer: any) => 
      selectedOffers.includes(offer.id)
    );
    const adjustments: any[] = [];

    appliedOffers.forEach((offer: any) => {
      switch (offer.offer_type) {
        case 'add_person':
          // For add_person: DISCOUNT for additional people (this is an OFFER, so it should save money)
          if (quantity >= offer.group_size) {
            const additionalPeople = quantity - offer.group_size + 1;
            // This is a discount, so we subtract the savings
            const discountAmount = additionalPeople * offer.price_adjustment;
            totalPrice -= discountAmount;
            adjustments.push({
              type: 'add_person',
              description: `${additionalPeople} additional person(s) discount`,
              cost: -discountAmount // Negative means discount/savings
            });
          }
          break;

        case 'flat_rate':
          // For flat_rate: replace base price (usually a discount)
          const flatRateSavings = (basePrice - offer.price_adjustment) * quantity;
          totalPrice = offer.price_adjustment * quantity;
          adjustments.push({
            type: 'flat_rate',
            description: `Flat rate discount`,
            cost: -flatRateSavings // Negative means discount/savings
          });
          break;

        case 'group_discount':
          // For group_discount: reduced price for groups
          if (quantity >= offer.group_size) {
            const discountPerTicket = basePrice - offer.price_adjustment;
            const totalDiscount = discountPerTicket * quantity;
            totalPrice -= totalDiscount;
            adjustments.push({
              type: 'group_discount',
              description: `Group discount (${offer.group_size}+ people)`,
              cost: -totalDiscount // Negative means discount/savings
            });
          }
          break;

        case 'student_discount':
          // For student_discount: reduced price for students
          const studentDiscountPerTicket = basePrice - offer.price_adjustment;
          const totalStudentDiscount = studentDiscountPerTicket * quantity;
          totalPrice -= totalStudentDiscount;
          adjustments.push({
            type: 'student_discount',
            description: `Student discount`,
            cost: -totalStudentDiscount // Negative means discount/savings
          });
          break;

        case 'women_flash_sale':
          // For women_flash_sale: special pricing (discount)
          const womenDiscountPerTicket = basePrice - offer.price_adjustment;
          const totalWomenDiscount = womenDiscountPerTicket * quantity;
          totalPrice -= totalWomenDiscount;
          adjustments.push({
            type: 'women_flash_sale',
            description: `Women special discount`,
            cost: -totalWomenDiscount // Negative means discount/savings
          });
          break;

        case 'razorpay_above':
          // For razorpay_above: additional payment fee (this is a cost, not a discount)
          const fee = offer.price_adjustment * quantity;
          totalPrice += fee;
          adjustments.push({
            type: 'razorpay_above',
            description: `Payment processing fee`,
            cost: fee // Positive means additional cost
          });
          break;

        case 'no_stag':
          // For no_stag: usually a small discount for group bookings
          if (quantity > 1) {
            const noStagDiscount = 50 * quantity; // Small discount for groups
            totalPrice -= noStagDiscount;
            adjustments.push({
              type: 'no_stag',
              description: `Group booking discount`,
              cost: -noStagDiscount // Negative means discount/savings
            });
          }
          break;

        default:
          // For other types: treat as discount if price_adjustment is positive
          if (offer.price_adjustment > 0) {
            // If price_adjustment is positive, it means the offer price is lower than base
            const discountPerTicket = basePrice - offer.price_adjustment;
            const totalDiscount = discountPerTicket * quantity;
            totalPrice -= totalDiscount;
            adjustments.push({
              type: offer.offer_type,
              description: `${offer.title} discount`,
              cost: -totalDiscount // Negative means discount/savings
            });
          } else {
            // If price_adjustment is negative, it's an additional cost
            const additionalCost = Math.abs(offer.price_adjustment) * quantity;
            totalPrice += additionalCost;
            adjustments.push({
              type: offer.offer_type,
              description: offer.title,
              cost: additionalCost // Positive means additional cost
            });
          }
      }
    });

    const savings = adjustments
      .filter(adj => adj.cost < 0)
      .reduce((sum, adj) => sum + Math.abs(adj.cost), 0);

    return {
      basePrice,
      totalPrice: Math.max(0, totalPrice),
      appliedOffers,
      savings,
      adjustments
    };
  };

  // Update pricing whenever offers or quantity changes
  useEffect(() => {
    const pricing = calculatePricing();
    console.log('🔄 Pricing updated:', pricing);
    onPricingChange(pricing);
  }, [selectedOffers, quantity, basePrice, event?.offers, onPricingChange]);

  const handleOfferToggle = (offerId: string) => {
    console.log('🔄 Toggling offer:', offerId);
    setSelectedOffers(prev => 
      prev.includes(offerId) 
        ? prev.filter(id => id !== offerId)
        : [...prev, offerId]
    );
  };

  // If no offers, don't render anything
  if (!event?.offers || event.offers.length === 0) {
    console.log('❌ No offers available, returning null');
    return null;
  }

  console.log('✅ Rendering OfferSelection with offers:', event.offers);

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">
          🎉 Special Offers Available! ({event.offers.length})
        </h3>
        
        <div className="space-y-3">
          {event.offers.map((offer: any, index: number) => {
            const isSelected = selectedOffers.includes(offer.id);
            const isEligible = (() => {
              if (!offer.is_active) return false;
              if (quantity < offer.min_quantity) return false;
              if (offer.max_quantity && quantity > offer.max_quantity) return false;
              
              switch (offer.offer_type) {
                case 'add_person':
                  return quantity >= offer.group_size;
                case 'group_discount':
                  return quantity >= offer.group_size;
                case 'no_stag':
                  return quantity > 1;
                default:
                  return true;
              }
            })();

            return (
              <div key={offer.id || index} className={`p-3 border rounded transition-all ${
                isSelected 
                  ? 'bg-green-50 border-green-300' 
                  : 'bg-white border-blue-300'
              } ${!isEligible ? 'opacity-50' : ''}`}>
                
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-blue-900">{offer.title}</div>
                    <div className="text-sm text-blue-700">{offer.description || 'Special offer'}</div>
                    <div className="text-xs text-blue-600 mt-1">
                      Type: {offer.offer_type} | Discount: ₹{offer.price_adjustment}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Min: {offer.min_quantity} | Group: {offer.group_size}
                      {offer.max_quantity && ` | Max: ${offer.max_quantity}`}
                    </div>
                    
                    {/* Show eligibility warning */}
                    {!isEligible && (
                      <div className="text-xs text-orange-600 mt-2 bg-orange-50 p-2 rounded">
                        {offer.offer_type === 'add_person' && quantity < offer.group_size && 
                          `Requires at least ${offer.group_size} tickets`}
                        {offer.offer_type === 'group_discount' && quantity < offer.group_size && 
                          `Requires at least ${offer.group_size} tickets`}
                        {offer.offer_type === 'no_stag' && quantity === 1 && 
                          'Group booking required'}
                        {!offer.is_active && 'Offer is currently inactive'}
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4">
                    <Switch
                      checked={isSelected}
                      onCheckedChange={() => handleOfferToggle(offer.id)}
                      disabled={!isEligible}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-3 text-sm text-blue-600">
          Select offers above to see pricing adjustments
        </div>
      </div>

      {/* Pricing Summary */}
      {selectedOffers.length > 0 && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-3">💰 Pricing Breakdown</h4>
          
          {(() => {
            const pricing = calculatePricing();
            return (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Base Price:</span>
                  <span>₹{basePrice} × {quantity} = ₹{basePrice * quantity}</span>
                </div>
                
                {pricing.adjustments.map((adj, idx) => (
                  <div key={idx} className={`flex justify-between ${
                    adj.cost > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    <span>{adj.description}:</span>
                    <span>
                      {adj.cost > 0 ? '+' : ''}₹{adj.cost}
                    </span>
                  </div>
                ))}
                
                {pricing.savings > 0 && (
                  <div className="flex justify-between text-green-700 font-medium border-t pt-2">
                    <span>Total Savings:</span>
                    <span>-₹{pricing.savings}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Final Price:</span>
                  <span className="text-green-700">₹{pricing.totalPrice}</span>
                </div>
                
                <div className="text-xs text-green-600">
                  ₹{(pricing.totalPrice / quantity).toFixed(0)} per ticket
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
