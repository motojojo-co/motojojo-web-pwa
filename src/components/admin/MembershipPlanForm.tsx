import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { 
  createMembershipPlan, 
  updateMembershipPlan, 
  type MembershipPlan,
  type CreateMembershipPlanData,
  type UpdateMembershipPlanData 
} from "@/services/adminMembershipService";

interface MembershipPlanFormProps {
  isOpen: boolean;
  onClose: () => void;
  plan?: MembershipPlan | null;
}

const MembershipPlanForm = ({ isOpen, onClose, plan }: MembershipPlanFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!plan;

  const [formData, setFormData] = useState({
    name: "",
    price_inr: 0,
    duration_days: 30,
    description: "",
    is_active: true,
  });

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name,
        price_inr: plan.price_inr,
        duration_days: plan.duration_days,
        description: plan.description || "",
        is_active: plan.is_active,
      });
    } else {
      setFormData({
        name: "",
        price_inr: 0,
        duration_days: 30,
        description: "",
        is_active: true,
      });
    }
  }, [plan]);

  const createMutation = useMutation({
    mutationFn: createMembershipPlan,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Membership plan created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["membership-plans"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create membership plan",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMembershipPlanData }) =>
      updateMembershipPlan(id, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Membership plan updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["membership-plans"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update membership plan",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Plan name is required",
        variant: "destructive",
      });
      return;
    }

    if (formData.price_inr <= 0) {
      toast({
        title: "Error",
        description: "Price must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (formData.duration_days <= 0) {
      toast({
        title: "Error",
        description: "Duration must be greater than 0 days",
        variant: "destructive",
      });
      return;
    }

    if (isEditing && plan) {
      updateMutation.mutate({
        id: plan.id,
        data: formData,
      });
    } else {
      createMutation.mutate(formData as CreateMembershipPlanData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-black">
            {isEditing ? "Edit Membership Plan" : "Create New Membership Plan"}
          </DialogTitle>
          <DialogDescription className="text-black">
            {isEditing 
              ? "Update the membership plan details below." 
              : "Fill in the details to create a new membership plan."
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-black">Plan Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Premium Monthly"
              className="text-black"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price" className="text-black">Price (INR)</Label>
            <Input
              id="price"
              type="number"
              value={formData.price_inr}
              onChange={(e) => setFormData({ ...formData, price_inr: Number(e.target.value) })}
              placeholder="999"
              min="0"
              step="1"
              className="text-black"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration" className="text-black">Duration (Days)</Label>
            <Input
              id="duration"
              type="number"
              value={formData.duration_days}
              onChange={(e) => setFormData({ ...formData, duration_days: Number(e.target.value) })}
              placeholder="30"
              min="1"
              step="1"
              className="text-black"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-black">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the benefits of this plan..."
              className="text-black"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active" className="text-black">Active Plan</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="text-black">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Update Plan" : "Create Plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MembershipPlanForm;
