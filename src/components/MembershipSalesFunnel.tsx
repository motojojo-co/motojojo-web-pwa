import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/ui/motion";
import {
  Crown,
  Star,
  Users,
  Gift,
  Calendar,
  MapPin,
  Zap,
  Shield,
  ArrowRight,
  CheckCircle,
  Sparkles,
  TrendingUp,
  Clock,
  Heart,
  X,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { getActiveMembership } from "@/services/membershipService";
import { getAllMembershipPlans } from "@/services/adminMembershipService";

interface MembershipSalesFunnelProps {
  eventId: string;
  eventName: string;
  eventPrice?: number;
  className?: string;
}

const MembershipSalesFunnel: React.FC<MembershipSalesFunnelProps> = ({
  eventId,
  eventName,
  eventPrice = 0,
  className = ""
}) => {
  const { isSignedIn, user } = useAuth();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTestimonials, setShowTestimonials] = useState(false);

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

  const benefits = [
    {
      icon: <Crown className="h-5 w-5 text-yellow-500" />,
      title: "Free Tickets",
      description: "Unlimited free access to all events",
      highlight: true
    },
    {
      icon: <Star className="h-5 w-5 text-purple-500" />,
      title: "Priority Access",
      description: "Book before anyone else",
      highlight: true
    },
    {
      icon: <Users className="h-5 w-5 text-blue-500" />,
      title: "VIP Community",
      description: "Exclusive member-only groups",
      highlight: false
    },
    {
      icon: <Gift className="h-5 w-5 text-pink-500" />,
      title: "Special Events",
      description: "Member-only curated experiences",
      highlight: false
    },
    {
      icon: <Calendar className="h-5 w-5 text-green-500" />,
      title: "Early Notifications",
      description: "Be the first to know about new events",
      highlight: false
    },
    {
      icon: <Shield className="h-5 w-5 text-indigo-500" />,
      title: "Premium Support",
      description: "24/7 priority customer support",
      highlight: false
    }
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      location: "Mumbai",
      text: "Since joining Premium, I've saved over ₹5,000 on tickets! The community is amazing too.",
      rating: 5
    },
    {
      name: "Arjun Patel",
      location: "Delhi",
      text: "Best investment ever! Free tickets to amazing events and I've made so many friends.",
      rating: 5
    },
    {
      name: "Sneha Reddy",
      location: "Bangalore",
      text: "The priority access is a game-changer. Never miss out on sold-out events anymore!",
      rating: 5
    }
  ];

  const handleGetPremium = () => {
    navigate("/pricing");
  };

  const handleLearnMore = () => {
    navigate("/membership");
  };

  return (
    <FadeIn className={`bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 rounded-2xl p-6 border border-purple-200 shadow-lg ${className}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Sparkles className="h-4 w-4" />
            Limited Time Offer
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Unlock Free Access to <span className="text-purple-600">{eventName}</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join thousands of members who get <strong>free tickets</strong> to all events, 
            priority access, and exclusive perks with Motojojo Premium.
          </p>
        </div>

        {/* Value Proposition */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-2 border-purple-200 bg-white/80">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {eventPrice > 0 ? `₹${eventPrice}` : 'Free'}
              </div>
              <div className="text-sm text-gray-600 mb-4">This Event</div>
              <div className="text-2xl font-bold text-green-600">
                ₹0
              </div>
              <div className="text-sm text-gray-600">With Premium</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-yellow-200 bg-white/80">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-bold text-yellow-600 mb-2">
                {savings > 0 ? `₹${savings}` : '₹500+'}
              </div>
              <div className="text-sm text-gray-600 mb-4">Saved Per Event</div>
              <div className="text-2xl font-bold text-green-600">
                ₹0
              </div>
              <div className="text-sm text-gray-600">With Premium</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-pink-200 bg-white/80">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-bold text-pink-600 mb-2">
                Unlimited
              </div>
              <div className="text-sm text-gray-600 mb-4">Events Per Month</div>
              <div className="text-2xl font-bold text-green-600">
                ₹0
              </div>
              <div className="text-sm text-gray-600">With Premium</div>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Grid */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-6">
            Why Choose Motojojo Premium?
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-4 rounded-lg ${
                  benefit.highlight 
                    ? 'bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200' 
                    : 'bg-white/60 border border-gray-200'
                }`}
              >
                {benefit.icon}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {benefit.title}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Card */}
        {primaryPlan && (
          <Card className="border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50 mb-8">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900">
                Most Popular Plan
              </CardTitle>
              <div className="text-4xl font-bold text-purple-600 mt-2">
                ₹{primaryPlan.price_inr}
                <span className="text-lg text-gray-600 font-normal">
                  /{Math.round(primaryPlan.duration_days / 30)} months
                </span>
              </div>
              <p className="text-gray-600 mt-2">
                {primaryPlan.description || "Enjoy unlimited free access to all events"}
              </p>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex justify-center items-center gap-4 mb-6">
                <div className="text-sm text-gray-600">Regular Price:</div>
                <div className="text-lg text-gray-500 line-through">₹{primaryPlan.price_inr * 2}</div>
                <Badge className="bg-green-100 text-green-800">
                  50% OFF
                </Badge>
              </div>
              
              <div className="space-y-3">
                <Button
                  onClick={handleGetPremium}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 text-lg rounded-xl shadow-lg"
                >
                  <Crown className="h-5 w-5 mr-2" />
                  Get Premium Now
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleLearnMore}
                  className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  Learn More About Benefits
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Social Proof */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 border-2 border-white"
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">
              Join <strong>2,500+</strong> happy members
            </span>
          </div>
          
          <div className="flex items-center justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="h-5 w-5 text-yellow-400 fill-current" />
            ))}
            <span className="ml-2 text-sm font-semibold text-gray-700">4.9/5</span>
          </div>
          <p className="text-sm text-gray-600">
            Rated excellent by our community
          </p>
        </div>

        {/* Testimonials */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setShowTestimonials(!showTestimonials)}
            className="w-full text-purple-600 hover:text-purple-700 hover:bg-purple-50"
          >
            {showTestimonials ? (
              <>
                Hide Member Reviews
                <ChevronUp className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                See What Members Say
                <ChevronDown className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
          
          {showTestimonials && (
            <FadeIn className="grid md:grid-cols-3 gap-4 mt-4">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="bg-white/80 border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="h-4 w-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-sm text-gray-700 mb-3 italic">
                      "{testimonial.text}"
                    </p>
                    <div className="text-sm font-semibold text-gray-900">
                      {testimonial.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {testimonial.location}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </FadeIn>
          )}
        </div>

        {/* Urgency Element */}
        <div className="bg-gradient-to-r from-orange-100 to-red-100 border border-orange-200 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-orange-600" />
            <span className="font-semibold text-orange-800">Limited Time Offer</span>
          </div>
          <p className="text-sm text-orange-700">
            Get 50% off your first membership. This offer expires soon!
          </p>
        </div>
      </div>
    </FadeIn>
  );
};

export default MembershipSalesFunnel;

