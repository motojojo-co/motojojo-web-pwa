import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAllMembershipPlans, deleteMembershipPlan, type MembershipPlan } from "@/services/adminMembershipService";
import MembershipPlanForm from "./MembershipPlanForm";

const MembershipPlans = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: plans = [], isLoading } = useQuery<MembershipPlan[]>({
    queryKey: ["membership-plans"],
    queryFn: getAllMembershipPlans,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMembershipPlan,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Membership plan deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["membership-plans"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete membership plan",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (plan: MembershipPlan) => {
    setEditingPlan(plan);
    setIsFormOpen(true);
  };

  const handleDelete = async (plan: MembershipPlan) => {
    if (window.confirm(`Are you sure you want to delete "${plan.name}"? This action cannot be undone.`)) {
      deleteMutation.mutate(plan.id);
    }
  };

  const handleAddNew = () => {
    setEditingPlan(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingPlan(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-black">Membership Plans</CardTitle>
            <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Plan
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-black">Name</TableHead>
                  <TableHead className="text-black">Price (INR)</TableHead>
                  <TableHead className="text-black">Duration (days)</TableHead>
                  <TableHead className="text-black">Status</TableHead>
                  <TableHead className="text-black">Description</TableHead>
                  <TableHead className="text-black">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.length > 0 ? (
                  plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium text-black">{plan.name}</TableCell>
                      <TableCell className="text-black">{plan.price_inr}</TableCell>
                      <TableCell className="text-black">{plan.duration_days}</TableCell>
                      <TableCell>
                        <Badge variant={plan.is_active ? "default" : "secondary"}>
                          {plan.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[400px] truncate text-black" title={plan.description || undefined}>
                        {plan.description || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(plan)}
                            className="text-black"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(plan)}
                            className="text-red-600 hover:text-red-700"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-black">
                      No membership plans found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <MembershipPlanForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        plan={editingPlan}
      />
    </>
  );
};

export default MembershipPlans;


