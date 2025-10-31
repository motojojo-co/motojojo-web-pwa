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
import { useToast } from "@/hooks/use-toast";
import { createHostSpace, updateHostSpace, HostSpace } from "@/services/hostSpaceService";
import { Plus, X, Upload, Image as ImageIcon } from "lucide-react";
import { sendHostSpaceNotification } from "@/services/hostSpaceService";

const spaceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  city: z.string().min(1, "City is required"),
  address: z.string().min(1, "Address is required"),
  capacity: z.number().optional(),
  available_start_time: z.string().optional(),
  available_end_time: z.string().optional(),
});

type SpaceFormData = z.infer<typeof spaceSchema>;

interface HostSpaceFormProps {
  space?: HostSpace;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function HostSpaceForm({ space, onSuccess, onCancel }: HostSpaceFormProps) {
  const { toast } = useToast();
  const [images, setImages] = useState<string[]>(space?.images || []);
  const [amenities, setAmenities] = useState<string[]>(space?.amenities || []);
  const [availableDates, setAvailableDates] = useState<string[]>(space?.available_dates || []);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newAmenity, setNewAmenity] = useState("");
  const [newDate, setNewDate] = useState("");
  const [loading, setLoading] = useState(false);

  const form = useForm<SpaceFormData>({
    resolver: zodResolver(spaceSchema),
    defaultValues: {
      name: space?.name || "",
      description: space?.description || "",
      location: space?.location || "",
      city: space?.city || "",
      address: space?.address || "",
      capacity: space?.capacity || undefined,
      available_start_time: space?.available_start_time || "",
      available_end_time: space?.available_end_time || "",
    },
  });

  const addImage = () => {
    if (newImageUrl.trim() && !images.includes(newImageUrl.trim())) {
      setImages([...images, newImageUrl.trim()]);
      setNewImageUrl("");
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const addAmenity = () => {
    if (newAmenity.trim() && !amenities.includes(newAmenity.trim())) {
      setAmenities([...amenities, newAmenity.trim()]);
      setNewAmenity("");
    }
  };

  const removeAmenity = (index: number) => {
    setAmenities(amenities.filter((_, i) => i !== index));
  };

  const addAvailableDate = () => {
    if (newDate && !availableDates.includes(newDate)) {
      setAvailableDates([...availableDates, newDate]);
      setNewDate("");
    }
  };

  const removeAvailableDate = (index: number) => {
    setAvailableDates(availableDates.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: SpaceFormData) => {
    setLoading(true);
    try {
      const spaceData = {
        ...data,
        images,
        amenities,
        available_dates: availableDates,
      };

      let result;
      if (space) {
        result = await updateHostSpace(space.id, spaceData);
      } else {
        result = await createHostSpace(spaceData);
        
        // Send notification for new space
        if (result.success && result.space) {
          const { data: { user } } = await import("@/integrations/supabase/client").then(m => m.supabase.auth.getUser());
          const userEmail = user?.email;
          await sendHostSpaceNotification(result.space, 'created', userEmail);
        }
      }

      if (result.success) {
        toast({
          title: "Success",
          description: space ? "Space updated successfully" : "Space submitted for approval",
        });
        onSuccess();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save space",
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

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{space ? "Edit Space" : "Add New Space"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Space Name *</Label>
              <Input {...form.register("name")} placeholder="e.g., My Living Room" />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>City *</Label>
              <Input {...form.register("city")} placeholder="e.g., Mumbai" />
              {form.formState.errors.city && (
                <p className="text-sm text-red-500">{form.formState.errors.city.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Location *</Label>
            <Input {...form.register("location")} placeholder="e.g., Andheri West" />
            {form.formState.errors.location && (
              <p className="text-sm text-red-500">{form.formState.errors.location.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Full Address *</Label>
            <Textarea {...form.register("address")} placeholder="Complete address" rows={2} />
            {form.formState.errors.address && (
              <p className="text-sm text-red-500">{form.formState.errors.address.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea {...form.register("description")} placeholder="Describe your space..." rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Capacity</Label>
              <Input 
                type="number" 
                {...form.register("capacity", { valueAsNumber: true })} 
                placeholder="Max capacity"
              />
            </div>
            <div className="space-y-2">
              <Label>Available Start Time</Label>
              <Input type="time" {...form.register("available_start_time")} />
            </div>
            <div className="space-y-2">
              <Label>Available End Time</Label>
              <Input type="time" {...form.register("available_end_time")} />
            </div>
          </div>

          {/* Images */}
          <div className="space-y-2">
            <Label>Images (like Airbnb)</Label>
            <div className="flex gap-2">
              <Input
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Image URL"
              />
              <Button type="button" onClick={addImage} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {images.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Space ${index + 1}`}
                      className="w-full h-24 object-cover rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Amenities */}
          <div className="space-y-2">
            <Label>Amenities</Label>
            <div className="flex gap-2">
              <Input
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
                placeholder="e.g., WiFi, Parking, Kitchen"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addAmenity();
                  }
                }}
              />
              <Button type="button" onClick={addAmenity} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {amenities.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {amenities.map((amenity, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-violet/10 text-violet rounded-full text-sm flex items-center gap-2"
                  >
                    {amenity}
                    <button
                      type="button"
                      onClick={() => removeAmenity(index)}
                      className="text-violet hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Available Dates */}
          <div className="space-y-2">
            <Label>Available Dates</Label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
              <Button type="button" onClick={addAvailableDate} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {availableDates.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {availableDates.map((date, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-yellow/10 text-violet rounded-full text-sm flex items-center gap-2"
                  >
                    {new Date(date).toLocaleDateString()}
                    <button
                      type="button"
                      onClick={() => removeAvailableDate(index)}
                      className="text-violet hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : space ? "Update" : "Submit for Approval"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


