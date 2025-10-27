import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { createRazorpayOrder, initializeRazorpayCheckout, verifyRazorpayPayment } from "@/services/razorpayService";
import { createUserMembership, getPlanByName } from "@/services/membershipService";
import { getAllMembershipPlans, type MembershipPlan } from "@/services/adminMembershipService";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import SubscriptionQuestionnaire from "@/components/SubscriptionQuestionnaire";
import { saveQuestionnaireData, updateQuestionnaireWithMembershipId } from "@/services/questionnaireService";

// Feature section removed per request

export default function PricingPage() {
  const { isSignedIn, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isPaying, setIsPaying] = useState(false);
  const [payingPlan, setPayingPlan] = useState<string | null>(null);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [selectedPlanForQuestionnaire, setSelectedPlanForQuestionnaire] = useState<{
    id: string;
    name: string;
    amount: number;
  } | null>(null);

  // Fetch membership plans from database
  const { data: membershipPlans = [], isLoading } = useQuery({
    queryKey: ["membership-plans"],
    queryFn: getAllMembershipPlans,
  });

  // Transform database plans to pricing page format
  const plans = membershipPlans
    .filter(plan => plan.is_active)
    .map(plan => ({
      id: plan.id,
      name: plan.name,
      amount: plan.price_inr,
      description: plan.description || "Enjoy free tickets on eligible events.",
      perks: ["Free tickets on eligible events", "Priority access", "VIP Support"],
      durationMonths: Math.round(plan.duration_days / 30), // Convert days to months
      durationDays: plan.duration_days,
    }))
    .sort((a, b) => a.amount - b.amount); // Sort by price

  const [selected, setSelected] = useState(plans[0]);

  // Update selected plan when plans are loaded
  useEffect(() => {
    if (plans.length > 0 && !selected) {
      setSelected(plans[0]);
    }
  }, [plans, selected]);

  const handleSubscribe = async (planId: string, planName: string, amountInr: number) => {
    if (!isSignedIn || !user?.id) {
      toast({ title: "Please sign in", description: "Sign in to subscribe to Motojojo Premium." });
      navigate("/auth");
      return;
    }

    // Show questionnaire first
    setSelectedPlanForQuestionnaire({ id: planId, name: planName, amount: amountInr });
    setShowQuestionnaire(true);
  };

  const handleQuestionnaireComplete = async (questionnaireData: any) => {
    if (!selectedPlanForQuestionnaire || !user?.id) return;

    setShowQuestionnaire(false);
    setIsPaying(true);
    setPayingPlan(selectedPlanForQuestionnaire.name);

    try {
      // Save questionnaire data to database first
      console.log('Saving questionnaire data...');
      const questionnaireResult = await saveQuestionnaireData(user.id, questionnaireData);
      
      if (!questionnaireResult.success) {
        console.error('Failed to save questionnaire data:', questionnaireResult.error);
        toast({ 
          title: "Warning", 
          description: "Questionnaire data couldn't be saved, but proceeding with payment.", 
          variant: "destructive" 
        });
      } else {
        console.log('Questionnaire data saved successfully');
      }

      // Create Razorpay order
      const order = await createRazorpayOrder({
        amount: selectedPlanForQuestionnaire.amount,
        currency: "INR",
        receipt: `premium_${selectedPlanForQuestionnaire.name}_${Date.now()}`,
        notes: { 
          type: "membership", 
          plan: selectedPlanForQuestionnaire.name, 
          userId: user.id,
          questionnaireData: JSON.stringify(questionnaireData)
        }
      });

      if (!order.success) throw new Error("Failed to create order");

      await initializeRazorpayCheckout(order.orderId, {
        key: "rzp_live_RBveSyibt8B7dS",
        amount: selectedPlanForQuestionnaire.amount * 100,
        currency: "INR",
        name: "Motojojo Premium",
        description: `${selectedPlanForQuestionnaire.name} Subscription`,
        prefill: { 
          name: questionnaireData.name || user.user_metadata?.full_name, 
          email: user.email,
          contact: questionnaireData.phoneNumber
        },
        theme: { color: "#D32F55" },
        modal: {
          ondismiss: () => {
            setIsPaying(false);
            setPayingPlan(null);
          }
        },
        handler: async (response: any) => {
          try {
            const verified = await verifyRazorpayPayment({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            if (!verified.verified) throw new Error("Payment verification failed");

            const created = await createUserMembership({
              userId: user.id,
              planId: selectedPlanForQuestionnaire.id,
              amountInr: selectedPlanForQuestionnaire.amount,
              paymentId: response.razorpay_payment_id,
            });
            if (!created) throw new Error("Failed to activate membership");

            // Update questionnaire data with membership ID
            console.log('Updating questionnaire data with membership ID...');
            const updateResult = await updateQuestionnaireWithMembershipId(user.id, response.razorpay_payment_id);
            if (!updateResult.success) {
              console.error('Failed to update questionnaire data with membership ID:', updateResult.error);
            } else {
              console.log('Questionnaire data updated with membership ID successfully');
            }

            toast({ title: "Premium Activated!", description: "Your Premium is active — tickets are now free on eligible events." });
            navigate("/profile");
          } catch (err: any) {
            toast({ title: "Subscription Error", description: err.message || "Please contact support.", variant: "destructive" });
          } finally {
            setIsPaying(false);
            setPayingPlan(null);
          }
        }
      });
    } catch (err: any) {
      setIsPaying(false);
      setPayingPlan(null);
      toast({ title: "Payment Error", description: err.message || "Unable to start payment.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-raspberry px-4 py-10">
        <Loader2 className="w-8 h-8 animate-spin text-sandstorm" />
        <p className="text-white/80 mt-4">Loading pricing plans...</p>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-raspberry px-4 py-10">
        <h1 className="text-4xl md:text-5xl font-extrabold text-sandstorm mb-3">No Plans Available</h1>
        <p className="text-white/80 max-w-2xl mx-auto text-center">
          Membership plans are currently being updated. Please check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-raspberry px-4 py-10">
      {/* Header */}
      <div className="w-full max-w-6xl text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-extrabold text-sandstorm mb-3">Choose what you need</h1>
        <p className="text-white/80 max-w-2xl mx-auto">
          Enjoy Premium benefits with your favorite Motojojo colors — free tickets on eligible events for the duration you choose.
        </p>
        <div className="mt-4 inline-flex items-center rounded-full bg-white/10 p-1 backdrop-blur">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelected(plan)}
              className={`px-4 py-2 text-sm font-semibold rounded-full transition ${
                selected?.name === plan.name
                  ? "bg-sandstorm text-black shadow"
                  : "text-white/90 hover:text-black hover:bg-sandstorm/80"
              }`}
            >
              {plan.durationMonths} Months
            </button>
          ))}
        </div>
      </div>

      {/* Plans grid */}
      <div id="plans" className="w-full max-w-6xl mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {plans.map((plan) => {
            const isFeatured = selected?.name === plan.name;
            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-all duration-300 bg-sandstorm/95 border-0 ${
                  isFeatured
                    ? "ring-4 ring-sandstorm/60 shadow-xl scale-[1.02]"
                    : "hover:scale-[1.01] shadow-md"
                }`}
              >
                {/* Glow */}
                <div className={`pointer-events-none absolute inset-0 ${isFeatured ? "bg-gradient-to-b from-yellow/20 to-orange-400/10" : ""}`}></div>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-xl md:text-2xl text-violet font-extrabold">{plan.name}</CardTitle>
                    <Badge className="bg-yellow text-black text-[10px] md:text-xs px-2 py-1 rounded-full">Premium</Badge>
                  </div>
                  <div className="text-2xl md:text-3xl font-extrabold text-black">₹{plan.amount}
                    <span className="text-sm font-semibold text-violet ml-1">/ {plan.durationMonths} mo</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-violet text-sm md:text-base mb-3">{plan.description}</p>
                  <ul className="space-y-2 text-black text-sm md:text-base mb-5">
                    {plan.perks.map((perk) => (
                      <li key={perk} className="flex items-start gap-2">
                        <span className="mt-1 h-2 w-2 rounded-full bg-yellow" />
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handleSubscribe(plan.id, plan.name, plan.amount)}
                    disabled={isPaying && payingPlan === plan.name}
                    className={`w-full font-bold text-lg py-2 ${
                      isFeatured
                        ? "bg-black text-sandstorm hover:bg-black/90"
                        : "bg-gradient-to-r from-yellow to-orange-400 text-black hover:opacity-90"
                    }`}
                  >
                    {isPaying && payingPlan === plan.name ? "Processing..." : "Subscribe"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Footer note */}
      <div className="flex flex-col items-center mt-2 mb-2">
        <CheckCircle className="h-10 w-10 text-green-500 mb-2" />
        <h3 className="text-xl font-bold text-sandstorm mb-2">Premium perks apply immediately after payment.</h3>
        <p className="text-base text-white/80 mb-4 text-center max-w-lg">
          After subscribing, your eligible event tickets will be free during your plan period.
        </p>
      </div>

      {/* Subscription Questionnaire */}
      {selectedPlanForQuestionnaire && (
        <SubscriptionQuestionnaire
          isOpen={showQuestionnaire}
          onClose={() => {
            setShowQuestionnaire(false);
            setSelectedPlanForQuestionnaire(null);
          }}
          onComplete={handleQuestionnaireComplete}
          planId={selectedPlanForQuestionnaire.id}
          planName={selectedPlanForQuestionnaire.name}
          amountInr={selectedPlanForQuestionnaire.amount}
        />
      )}
    </div>
  );
}
