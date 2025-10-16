import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { createEventForCommunityLead } from "@/services/communityLeadService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import EventForm from "@/components/admin/EventForm";
import { FadeIn } from "@/components/ui/motion";
import { ArrowLeft, Calendar, MapPin, DollarSign, Users } from "lucide-react";

const CommunityLeadCreateEvent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    if (!user?.id) return;
    setIsSubmitting(true);
    try {
      // Ensure required admin fields exist; set sane defaults if missing
      const prepared = {
        ...data,
        is_published: data.is_published ?? true,
        created_by: user.id,
      };

      await createEventForCommunityLead(prepared, user.id);
      toast({
        title: "Event Created Successfully",
        description: "Your event has been created and is now live.",
      });
      navigate("/communitylead/activity");
    } catch (error: any) {
      console.error("Error creating event:", error);
      toast({
        title: "Error Creating Event",
        description: error.message || "Failed to create event. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      <div className="bg-white shadow-sm border-b pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/communitylead/activity")}
              className="mr-4 text-black"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Activity
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-black">Create New Event</h1>
              <p className="text-black">Create and manage your community events</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <FadeIn>
          <Card>
            <CardHeader>
              <CardTitle className="text-black">Event Details</CardTitle>
              <CardDescription className="text-black">
                Fill in the details for your new event
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EventForm initialData={{}} onSubmit={handleSubmit} />
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
};

export default CommunityLeadCreateEvent;
