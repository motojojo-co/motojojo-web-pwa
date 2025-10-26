import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Crown,
  Star,
  X,
  Sparkles,
  Clock,
  TrendingUp
} from "lucide-react";
import { getActiveMembership } from "@/services/membershipService";
import { getAllMembershipPlans } from "@/services/adminMembershipService";

interface FloatingMembershipFunnelProps {
  eventId: string;
  eventName: string;
  eventPrice?: number;
  className?: string;
}

const FloatingMembershipFunnel: React.FC<FloatingMembershipFunnelProps> = ({
  eventId,
  eventName,
  eventPrice = 0,
  className = ""
}) => {
  const { isSignedIn, user } = useAuth();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if user has active membership
  const { data: membership, isLoading: membershipLoading } = useQuery({
    queryKey: ["active-membership", user?.id],
    queryFn: () => getActiveMembership(user?.id || ""),
    enabled: !!user?.id,
  });

  // Fetch membership plans
  const { data: membershipPlans = [] } = useQuery({
    queryKey: ["membership-plans"],
    queryFn: getAllMembershipPlans,
  });

  const hasActiveMembership = membership?.hasActive || false;

  // Show funnel after 3 seconds if user doesn't have membership
  useEffect(() => {
    if (!hasActiveMembership && !membershipLoading && !isDismissed) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [hasActiveMembership, membershipLoading, isDismissed]);

  // Don't show if user has membership or is loading
  if (hasActiveMembership || membershipLoading || !isVisible || isDismissed) {
    return null;
  }

  const activePlans = membershipPlans
    .filter(plan => plan.is_active)
    .sort((a, b) => a.price_inr - b.price_inr);

  const primaryPlan = activePlans[0];
  const savings = eventPrice > 0 ? Math.round(eventPrice * 0.5) : 0;

  const handleGetPremium = () => {
    navigate("/pricing");
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
  };

  return (
    <div className={`fixed bottom-20 left-4 right-4 z-50 md:hidden ${className}`}>
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-4 shadow-2xl border border-purple-300">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-white" />
            <span className="font-bold text-white">Premium Offer</span>
            <Badge className="bg-green-500 text-white text-xs">
              50% OFF
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0 text-white/80 hover:text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3">
          <div>
            <h3 className="text-white font-bold text-lg mb-1">
              Get <span className="text-yellow-300">{eventName}</span> for FREE!
            </h3>
            <p className="text-white/90 text-sm">
              Join Premium and save ₹{savings || eventPrice} on this event
            </p>
          </div>

          <div className="flex items-center justify-between bg-white/20 rounded-lg p-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                ₹{eventPrice}
              </div>
              <div className="text-xs text-white/80">Regular</div>
            </div>
            <div className="text-white/60 text-2xl">→</div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-300">
                ₹0
              </div>
              <div className="text-xs text-white/80">With Premium</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-white/90 text-sm mb-3">
            <Crown className="h-4 w-4 text-yellow-300" />
            <span>Free tickets to all events</span>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleGetPremium}
              className="w-full bg-white text-purple-600 hover:bg-white/90 font-bold py-3 rounded-xl shadow-lg"
            >
              <Crown className="h-4 w-4 mr-2" />
              Get Premium Now
            </Button>
            
            <div className="flex items-center justify-center gap-2 text-white/80 text-xs">
              <Clock className="h-3 w-3" />
              <span>Limited time offer - 50% off</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloatingMembershipFunnel;
