import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Crown,
  Star,
  Users,
  Gift,
  ArrowRight,
  X,
  CheckCircle,
  Sparkles,
  TrendingUp,
  Clock
} from "lucide-react";
import { getActiveMembership } from "@/services/membershipService";
import { getAllMembershipPlans } from "@/services/adminMembershipService";

interface CompactMembershipFunnelProps {
  eventId: string;
  eventName: string;
  eventPrice?: number;
  className?: string;
  onClose?: () => void;
}

const CompactMembershipFunnel: React.FC<CompactMembershipFunnelProps> = ({
  eventId,
  eventName,
  eventPrice = 0,
  className = "",
  onClose
}) => {
  const { isSignedIn, user } = useAuth();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

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

  // Don't show sales funnel if user already has membership
  if (hasActiveMembership || membershipLoading) {
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

  const handleLearnMore = () => {
    navigate("/membership");
  };

  return (
    <Card className={`bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 shadow-lg ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <span className="font-semibold text-purple-800">Premium Offer</span>
            <Badge className="bg-green-100 text-green-800 text-xs">
              50% OFF
            </Badge>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="space-y-3">
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Get <span className="text-purple-600">{eventName}</span> for FREE!
            </h3>
            <p className="text-sm text-gray-600">
              Join Premium and save ₹{savings || eventPrice} on this event
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-white/60 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">
                ₹{eventPrice}
              </div>
              <div className="text-xs text-gray-600">Regular Price</div>
            </div>
            <div className="text-center p-3 bg-green-100 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">
                ₹0
              </div>
              <div className="text-xs text-gray-600">With Premium</div>
            </div>
          </div>

          {!isExpanded ? (
            <div className="space-y-2">
              <Button
                onClick={handleGetPremium}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2.5 rounded-lg"
              >
                <Crown className="h-4 w-4 mr-2" />
                Get Premium Now
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => setIsExpanded(true)}
                className="w-full text-purple-600 hover:text-purple-700 hover:bg-purple-50 text-sm"
              >
                See All Benefits
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <Crown className="h-4 w-4 text-yellow-500" />
                  <span>Free Tickets</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-purple-500" />
                  <span>Priority Access</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span>VIP Community</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Gift className="h-4 w-4 text-pink-500" />
                  <span>Special Events</span>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-semibold text-orange-800">Limited Time</span>
                </div>
                <p className="text-xs text-orange-700">
                  50% off your first membership. Offer expires soon!
                </p>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handleGetPremium}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2.5 rounded-lg"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Get Premium Now
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleLearnMore}
                  className="w-full border-purple-300 text-purple-700 hover:bg-purple-50 text-sm"
                >
                  Learn More
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CompactMembershipFunnel;

