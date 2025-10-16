import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { getActiveMembership } from "@/services/membershipService";
import { Crown, Lock } from "lucide-react";

interface MembershipRSVPButtonProps {
  eventId: string;
  eventName: string;
  className?: string;
  onSuccess?: () => void;
}

const MembershipRSVPButton = ({ 
  eventId, 
  eventName, 
  className = "",
  onSuccess 
}: MembershipRSVPButtonProps) => {
  const { isSignedIn, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if user has active membership
  const { data: membership, isLoading: membershipLoading } = useQuery({
    queryKey: ["active-membership", user?.id],
    queryFn: () => getActiveMembership(user?.id || ""),
    enabled: !!user?.id,
  });

  const hasActiveMembership = membership?.hasActive || false;

  const handleRSVP = async () => {
    if (!isSignedIn || !user?.id) {
      toast({
        title: "Please sign in",
        description: "Sign in to RSVP for events.",
      });
      navigate("/auth");
      return;
    }

    if (!hasActiveMembership) {
      toast({
        title: "Premium Membership Required",
        description: "Get Motojojo Premium for free tickets and exclusive perks!",
        action: {
          label: "View Plans",
          onClick: () => navigate("/pricing"),
        },
      });
      return;
    }

    // User has active membership, proceed with RSVP
    setIsProcessing(true);
    
    try {
      // Navigate to booking page for free ticket
      navigate(`/book/${eventId}`);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("RSVP error:", error);
      toast({
        title: "RSVP Failed",
        description: "Unable to process your RSVP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBuyMembership = () => {
    navigate("/pricing");
  };

  if (membershipLoading) {
    return (
      <Button
        className={`px-8 py-3 text-base rounded-full bg-pink-600 hover:bg-pink-700 text-white font-bold shadow-md transition-colors duration-150 ${className}`}
        disabled
        style={{ boxShadow: "0 2px 8px rgba(255, 56, 92, 0.15)" }}
      >
        Loading...
      </Button>
    );
  }

  if (!isSignedIn) {
    return (
      <Button
        className={`ml-4 px-8 py-3 text-base rounded-full bg-pink-600 hover:bg-pink-700 text-white font-bold shadow-md transition-colors duration-150 ${className}`}
        style={{ boxShadow: "0 2px 8px rgba(255, 56, 92, 0.15)" }}
        onClick={() => navigate(`/auth?redirect=/events/${eventId}`)}
      >
        Sign In to RSVP
      </Button>
    );
  }

  if (hasActiveMembership) {
    return (
      <Button
        className={`ml-4 px-8 py-3 text-base rounded-full bg-pink-600 hover:bg-pink-700 text-white font-bold shadow-md transition-colors duration-150 ${className}`}
        style={{ boxShadow: "0 2px 8px rgba(255, 56, 92, 0.15)" }}
        onClick={handleRSVP}
        disabled={isProcessing}
      >
        {isProcessing ? (
          "Processing..."
        ) : (
          <>
            <Crown className="w-4 h-4 mr-2" />
            RSVP Now (Free)
          </>
        )}
      </Button>
    );
  }

  // User is signed in but doesn't have active membership
  return (
    <div className="flex flex-col sm:flex-row gap-2 ml-4">
      <Button
        className={`px-6 py-3 text-base rounded-full bg-pink-600 hover:bg-pink-700 text-white font-bold shadow-md transition-colors duration-150 ${className}`}
        style={{ boxShadow: "0 2px 8px rgba(255, 56, 92, 0.15)" }}
        onClick={handleRSVP}
        disabled={isProcessing}
      >
        {isProcessing ? (
          "Processing..."
        ) : (
          <>
            <Lock className="w-4 h-4 mr-2" />
            RSVP Now
          </>
        )}
      </Button>
      <Button
        className="px-6 py-3 text-base rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold shadow-md transition-colors duration-150"
        onClick={handleBuyMembership}
      >
        <Crown className="w-4 h-4 mr-2" />
        Get Premium
      </Button>
    </div>
  );
};

export default MembershipRSVPButton;
