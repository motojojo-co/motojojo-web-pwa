import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createEventRequest, HostSpace } from "@/services/hostSpaceService";
import { sendEventRequestNotification } from "@/services/hostSpaceService";

const requestSchema = z.object({
  host_space_id: z.string().min(1, "Please select a space"),
  event_title: z.string().min(1, "Event title is required"),
  event_description: z.string().optional(),
  requested_date: z.string().min(1, "Date is required"),
  requested_start_time: z.string().min(1, "Start time is required"),
  requested_end_time: z.string().optional(),
  expected_capacity: z.number().optional(),
  event_category: z.string().optional(),
});

type RequestFormData = z.infer<typeof requestSchema>;

interface EventRequestFormProps {
  spaces: HostSpace[];
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EventRequestForm({ spaces, onSuccess, onCancel }: EventRequestFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const approvedSpaces = spaces.filter(s => s.status === 'approved');

  const form = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      host_space_id: "",
      event_title: "",
      event_description: "",
      requested_date: "",
      requested_start_time: "",
      requested_end_time: "",
      expected_capacity: undefined,
      event_category: "",
    },
  });

  const onSubmit = async (data: RequestFormData) => {
    setLoading(true);
    try {
      const result = await createEventRequest(data);

      if (result.success && result.request) {
        // Send notification
        const { data: { user } } = await import("@/integrations/supabase/client").then(m => m.supabase.auth.getUser());
        const userEmail = user?.email;
        await sendEventRequestNotification(result.request, 'created', userEmail);

        toast({
          title: "Success",
          description: "Event request submitted for approval",
        });
        onSuccess();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to submit request",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (approvedSpaces.length === 0) {
    return (
      <Dialog open={true} onOpenChange={onCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No Approved Spaces</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            You need at least one approved space to request an event. Please add a space and wait for admin approval.
          </p>
          <Button onClick={onCancel} className="w-full">Close</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Request Event at Your Space</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Select Space *</Label>
            <Select
              value={form.watch("host_space_id")}
              onValueChange={(value) => form.setValue("host_space_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a space" />
              </SelectTrigger>
              <SelectContent>
                {approvedSpaces.map((space) => (
                  <SelectItem key={space.id} value={space.id}>
                    {space.name} - {space.location}, {space.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.host_space_id && (
              <p className="text-sm text-red-500">{form.formState.errors.host_space_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Event Title *</Label>
            <Input {...form.register("event_title")} placeholder="e.g., Music Night" />
            {form.formState.errors.event_title && (
              <p className="text-sm text-red-500">{form.formState.errors.event_title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Event Description</Label>
            <Textarea {...form.register("event_description")} placeholder="Describe the event..." rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input type="date" {...form.register("requested_date")} />
              {form.formState.errors.requested_date && (
                <p className="text-sm text-red-500">{form.formState.errors.requested_date.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Start Time *</Label>
              <Input type="time" {...form.register("requested_start_time")} />
              {form.formState.errors.requested_start_time && (
                <p className="text-sm text-red-500">{form.formState.errors.requested_start_time.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input type="time" {...form.register("requested_end_time")} />
            </div>
            <div className="space-y-2">
              <Label>Expected Capacity</Label>
              <Input 
                type="number" 
                {...form.register("expected_capacity", { valueAsNumber: true })} 
                placeholder="Number of attendees"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Event Category</Label>
            <Input {...form.register("event_category")} placeholder="e.g., Music, Workshop, Gathering" />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


