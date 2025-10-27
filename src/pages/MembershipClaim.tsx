import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  CheckCircle, 
  Loader2, 
  Gift, 
  Users, 
  Shield, 
  Star,
  Info,
  AlertCircle,
  Crown
} from "lucide-react";
import { createUserMembership, getPlanByName } from "@/services/membershipService";
import { getAllMembershipPlans } from "@/services/adminMembershipService";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { cities } from "@/data/mockData";

export default function MembershipClaim() {
  const { isSignedIn, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isClaiming, setIsClaiming] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // City state for Navbar
  const [selectedCity, setSelectedCity] = useState("Mumbai");

  useEffect(() => {
    const storedCity = localStorage.getItem("selectedCity");
    if (storedCity && cities.some(c => c.name === storedCity)) {
      setSelectedCity(storedCity);
    }
  }, []);

  useEffect(() => {
    if (selectedCity) {
      localStorage.setItem("selectedCity", selectedCity);
    }
  }, [selectedCity]);

  // Fetch membership plans from database
  const { data: membershipPlans = [], isLoading } = useQuery({
    queryKey: ["membership-plans"],
    queryFn: getAllMembershipPlans,
  });

  // Filter for quarterly plans (3 months = ~90 days)
  const quarterlyPlans = membershipPlans
    .filter(plan => plan.is_active && plan.duration_days >= 85 && plan.duration_days <= 95)
    .sort((a, b) => a.price_inr - b.price_inr);

  const handleClaimMembership = async (planId: string, planName: string) => {
    if (!isSignedIn || !user?.id) {
      toast({ 
        title: "Please sign in", 
        description: "You need to be signed in to claim your membership." 
      });
      navigate("/auth?redirect=/claim-membership");
      return;
    }

    setIsClaiming(true);
    try {
      // Create membership without payment (since they paid offline)
      const created = await createUserMembership({
        userId: user.id,
        planId: planId,
        amountInr: 0, // Free since they paid offline
        paymentId: `google_forms_${Date.now()}`, // Special payment ID for Google Forms
      });

      if (!created) throw new Error("Failed to activate membership");

      toast({ 
        title: "Membership Claimed Successfully!", 
        description: `Your ${planName} membership is now active. Enjoy your premium benefits!` 
      });
      navigate("/profile");
    } catch (err: any) {
      toast({ 
        title: "Claim Error", 
        description: err.message || "Unable to claim membership. Please contact support.", 
        variant: "destructive" 
      });
    } finally {
      setIsClaiming(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-raspberry px-4 py-10">
        <Loader2 className="w-8 h-8 animate-spin text-sandstorm" />
        <p className="text-white/80 mt-4">Loading membership plans...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-raspberry">
      <Navbar selectedCity={selectedCity} setSelectedCity={setSelectedCity} bgColor="#CF2B56" />
      
      <main className="flex-grow pt-24 pb-20">
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Gift className="h-12 w-12 text-sandstorm mr-3" />
              <h1 className="text-4xl md:text-5xl font-extrabold text-sandstorm">
                Claim Your Membership
              </h1>
            </div>
            <p className="text-xl text-white/90 max-w-3xl mx-auto mb-6">
              Welcome! You've purchased your membership through our Google Forms. 
              Click the button below to activate your premium benefits.
            </p>
            
            {/* Information Card */}
            <Card className="max-w-4xl mx-auto mb-8 bg-white/95 border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Info className="h-6 w-6 text-violet mt-1 flex-shrink-0" />
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-violet mb-2">Why This Page Exists</h3>
                    <p className="text-gray-700 mb-3">
                      This page is specifically for members who purchased their membership through our Google Forms. 
                      Since you've already paid offline, we're providing you with a convenient way to activate your 
                      membership benefits without going through the payment process again.
                    </p>
                    <h4 className="text-md font-semibold text-violet mb-2">Who Can Access This Page:</h4>
                    <ul className="text-gray-700 space-y-1">
                      <li>• Members who purchased membership through Google Forms</li>
                      <li>• Members who paid offline and need to activate their benefits</li>
                      <li>• Anyone with the direct link to this page</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Available Plans */}
          {quarterlyPlans.length > 0 ? (
            <div className="max-w-4xl mx-auto mb-12">
              <h2 className="text-2xl font-bold text-white text-center mb-8">
                Select Your Quarterly Membership Plan
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {quarterlyPlans.map((plan) => {
                  const durationMonths = Math.round(plan.duration_days / 30);
                  const isSelected = selectedPlan === plan.id;
                  
                  return (
                    <Card
                      key={plan.id}
                      className={`relative overflow-hidden transition-all duration-300 bg-sandstorm/95 border-0 cursor-pointer ${
                        isSelected
                          ? "ring-4 ring-sandstorm/60 shadow-xl scale-[1.02]"
                          : "hover:scale-[1.01] shadow-md"
                      }`}
                      onClick={() => setSelectedPlan(plan.id)}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <CardTitle className="text-xl md:text-2xl text-violet font-extrabold flex items-center gap-2">
                            <Crown className="h-6 w-6 text-yellow" />
                            {plan.name}
                          </CardTitle>
                          <Badge className="bg-yellow text-black text-xs px-2 py-1 rounded-full">
                            Quarterly
                          </Badge>
                        </div>
                        <div className="text-2xl md:text-3xl font-extrabold text-black">
                          FREE
                          <span className="text-sm font-semibold text-violet ml-1">
                            / {durationMonths} months
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-violet text-sm md:text-base mb-3">
                          {plan.description || "Enjoy free tickets on eligible events."}
                        </p>
                        <ul className="space-y-2 text-black text-sm md:text-base mb-5">
                          <li className="flex items-start gap-2">
                            <span className="mt-1 h-2 w-2 rounded-full bg-yellow" />
                            <span>Free tickets on eligible events</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="mt-1 h-2 w-2 rounded-full bg-yellow" />
                            <span>Priority access to events</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="mt-1 h-2 w-2 rounded-full bg-yellow" />
                            <span>VIP Support</span>
                          </li>
                        </ul>
                        <Button
                          onClick={() => handleClaimMembership(plan.id, plan.name)}
                          disabled={isClaiming}
                          className="w-full font-bold text-lg py-2 bg-black text-sandstorm hover:bg-black/90"
                        >
                          {isClaiming ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Claiming...
                            </>
                          ) : (
                            "Claim Membership"
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto text-center">
              <AlertCircle className="h-16 w-16 text-yellow mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">
                No Quarterly Plans Available
              </h2>
              <p className="text-white/80 mb-6">
                We're currently updating our membership plans. Please contact our support team 
                to claim your membership manually.
              </p>
              <Button 
                onClick={() => navigate("/contact")}
                className="bg-sandstorm text-black hover:bg-sandstorm/90 font-bold"
              >
                Contact Support
              </Button>
            </div>
          )}

          {/* Benefits Section */}
          <div className="max-w-4xl mx-auto mb-12">
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              What You Get With Your Membership
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-white/90 border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <Star className="h-8 w-8 text-yellow mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-violet mb-2">Free Event Tickets</h3>
                  <p className="text-gray-600 text-sm">
                    Enjoy complimentary tickets to eligible events during your membership period.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/90 border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <Users className="h-8 w-8 text-violet mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-violet mb-2">Priority Access</h3>
                  <p className="text-gray-600 text-sm">
                    Get early access to new events and exclusive member-only gatherings.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/90 border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <Shield className="h-8 w-8 text-sandstorm mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-violet mb-2">VIP Support</h3>
                  <p className="text-gray-600 text-sm">
                    Receive priority customer support and assistance from our team.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center">
            <Card className="max-w-2xl mx-auto bg-white/90 border-0 shadow-lg">
              <CardContent className="p-6">
                <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-violet mb-2">
                  Membership Benefits Apply Immediately
                </h3>
                <p className="text-gray-600">
                  Once you claim your membership, all premium benefits will be active 
                  immediately. You can start enjoying free tickets on eligible events right away!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
