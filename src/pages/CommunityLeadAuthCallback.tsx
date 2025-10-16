import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { convertUserToCommunityLead } from "@/services/communityLeadService";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const CommunityLeadAuthCallback = () => {
  const navigate = useNavigate();
  const { user, isLoaded, isSignedIn } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      if (!isLoaded) return;

      if (!isSignedIn || !user) {
        toast({
          title: "Authentication Failed",
          description: "Please try signing in again.",
          variant: "destructive"
        });
        navigate("/community-lead/login");
        return;
      }

      try {
        // Check if user is already a community lead
        if (user.user_metadata?.role === 'community_lead') {
          navigate("/communitylead/activity");
          return;
        }

        // Convert user to community lead
        await convertUserToCommunityLead(user.id, user);
        
        toast({
          title: "Welcome to Community Leads!",
          description: "Your account has been set up as a community lead.",
        });

        navigate("/communitylead/activity");
      } catch (error: any) {
        console.error("Error setting up community lead account:", error);
        toast({
          title: "Setup Failed",
          description: "Failed to set up your community lead account. Please try again.",
          variant: "destructive"
        });
        navigate("/community-lead/login");
      } finally {
        setIsProcessing(false);
      }
    };

    handleAuthCallback();
  }, [isLoaded, isSignedIn, user, navigate, toast]);

  if (!isLoaded || isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  return null;
};

export default CommunityLeadAuthCallback;
