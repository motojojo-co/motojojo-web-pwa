import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getPendingHostSpaces,
  getPendingEventRequests,
  approveHostSpace,
  approveEventRequest,
  HostSpace,
  HostEventRequest,
  sendHostSpaceNotification,
  sendEventRequestNotification,
} from "@/services/hostSpaceService";
import { Check, X, MapPin, Calendar, Clock } from "lucide-react";

const HostSpaceApprovals = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSpace, setSelectedSpace] = useState<HostSpace | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<HostEventRequest | null>(null);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [approvalType, setApprovalType] = useState<"space" | "request" | null>(null);

  const { data: pendingSpaces = [], isLoading: spacesLoading } = useQuery({
    queryKey: ["pending-host-spaces"],
    queryFn: getPendingHostSpaces,
  });

  const { data: pendingRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ["pending-event-requests"],
    queryFn: getPendingEventRequests,
  });

  const handleApprove = async () => {
    if (!selectedSpace && !selectedRequest) return;

    setLoading(true);
    try {
      if (approvalType === "space" && selectedSpace) {
        const result = await approveHostSpace(selectedSpace.id, "approved");
        if (result.success) {
          // Get host email and send notification
          const hostEmail = (selectedSpace as any).hosts?.users?.email;
          await sendHostSpaceNotification(selectedSpace, "approved", hostEmail);
          
          toast({
            title: "Success",
            description: "Host space approved successfully",
          });
          setIsApprovalDialogOpen(false);
          setSelectedSpace(null);
          queryClient.invalidateQueries({ queryKey: ["pending-host-spaces"] });
          queryClient.invalidateQueries({ queryKey: ["host-spaces"] });
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to approve space",
            variant: "destructive",
          });
        }
      } else if (approvalType === "request" && selectedRequest) {
        const result = await approveEventRequest(selectedRequest.id, "approved");
        if (result.success) {
          // Get host email and send notification
          const hostEmail = (selectedRequest as any).hosts?.users?.email;
          await sendEventRequestNotification(selectedRequest, "approved", hostEmail);
          
          toast({
            title: "Success",
            description: "Event request approved successfully",
          });
          setIsApprovalDialogOpen(false);
          setSelectedRequest(null);
          queryClient.invalidateQueries({ queryKey: ["pending-event-requests"] });
          queryClient.invalidateQueries({ queryKey: ["host-event-requests"] });
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to approve request",
            variant: "destructive",
          });
        }
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

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a rejection reason",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (approvalType === "space" && selectedSpace) {
        const result = await approveHostSpace(selectedSpace.id, "rejected", rejectionReason);
        if (result.success) {
          // Get host email and send notification
          const hostEmail = (selectedSpace as any).hosts?.users?.email;
          await sendHostSpaceNotification(selectedSpace, "rejected", hostEmail);
          
          toast({
            title: "Success",
            description: "Host space rejected",
          });
          setIsRejectionDialogOpen(false);
          setRejectionReason("");
          setSelectedSpace(null);
          queryClient.invalidateQueries({ queryKey: ["pending-host-spaces"] });
          queryClient.invalidateQueries({ queryKey: ["host-spaces"] });
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to reject space",
            variant: "destructive",
          });
        }
      } else if (approvalType === "request" && selectedRequest) {
        const result = await approveEventRequest(selectedRequest.id, "rejected", rejectionReason);
        if (result.success) {
          // Get host email and send notification
          const hostEmail = (selectedRequest as any).hosts?.users?.email;
          await sendEventRequestNotification(selectedRequest, "rejected", hostEmail);
          
          toast({
            title: "Success",
            description: "Event request rejected",
          });
          setIsRejectionDialogOpen(false);
          setRejectionReason("");
          setSelectedRequest(null);
          queryClient.invalidateQueries({ queryKey: ["pending-event-requests"] });
          queryClient.invalidateQueries({ queryKey: ["host-event-requests"] });
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to reject request",
            variant: "destructive",
          });
        }
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
    <div className="min-h-screen bg-gray-50 text-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Host Space & Event Request Approvals</h1>

        <Tabs defaultValue="spaces" className="space-y-6">
          <TabsList>
            <TabsTrigger value="spaces">Pending Spaces ({pendingSpaces.length})</TabsTrigger>
            <TabsTrigger value="requests">Pending Requests ({pendingRequests.length})</TabsTrigger>
          </TabsList>

          {/* Host Spaces Tab */}
          <TabsContent value="spaces" className="space-y-4">
            {spacesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : pendingSpaces.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No pending host spaces to review</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingSpaces.map((space: any) => (
                  <Card key={space.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-semibold">{space.name}</h3>
                            <Badge variant="secondary">Pending</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Host:</strong> {space.hosts?.host_name || "Unknown"} ({space.hosts?.users?.email || "N/A"})
                          </p>
                          <p className="text-sm text-gray-600 mb-2">
                            <MapPin className="h-4 w-4 inline mr-1" />
                            {space.location}, {space.city}
                          </p>
                          <p className="text-sm text-gray-600 mb-2">{space.address}</p>
                          {space.description && (
                            <p className="text-sm text-gray-600 mb-2">{space.description}</p>
                          )}
                          {space.capacity && (
                            <p className="text-sm text-violet">Capacity: {space.capacity}</p>
                          )}
                          {space.amenities && space.amenities.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {space.amenities.map((amenity: string, idx: number) => (
                                <Badge key={idx} variant="outline">{amenity}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        {space.images && space.images.length > 0 && (
                          <img
                            src={space.images[0]}
                            alt={space.name}
                            className="w-32 h-32 object-cover rounded ml-4"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/placeholder.svg";
                            }}
                          />
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setSelectedSpace(space);
                            setApprovalType("space");
                            setIsApprovalDialogOpen(true);
                          }}
                          className="flex-1"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            setSelectedSpace(space);
                            setApprovalType("space");
                            setIsRejectionDialogOpen(true);
                          }}
                          className="flex-1"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Event Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            {requestsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No pending event requests to review</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request: any) => (
                  <Card key={request.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-semibold">{request.event_title}</h3>
                            <Badge variant="secondary">Pending</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Host:</strong> {request.hosts?.host_name || "Unknown"} ({request.hosts?.users?.email || "N/A"})
                          </p>
                          {request.host_space && (
                            <p className="text-sm text-gray-600 mb-2">
                              <MapPin className="h-4 w-4 inline mr-1" />
                              Space: {request.host_space.name} - {request.host_space.location}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <span>
                              <Calendar className="h-4 w-4 inline mr-1" />
                              {new Date(request.requested_date).toLocaleDateString()}
                            </span>
                            <span>
                              <Clock className="h-4 w-4 inline mr-1" />
                              {request.requested_start_time}
                              {request.requested_end_time && ` - ${request.requested_end_time}`}
                            </span>
                          </div>
                          {request.event_description && (
                            <p className="text-sm text-gray-600 mb-2">{request.event_description}</p>
                          )}
                          {request.expected_capacity && (
                            <p className="text-sm text-violet">Expected Capacity: {request.expected_capacity}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setSelectedRequest(request);
                            setApprovalType("request");
                            setIsApprovalDialogOpen(true);
                          }}
                          className="flex-1"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            setSelectedRequest(request);
                            setApprovalType("request");
                            setIsRejectionDialogOpen(true);
                          }}
                          className="flex-1"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Approval Dialog */}
        <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Approval</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-600">
              Are you sure you want to approve this {approvalType === "space" ? "host space" : "event request"}?
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsApprovalDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleApprove} disabled={loading}>
                {loading ? "Approving..." : "Approve"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rejection Dialog */}
        <Dialog open={isRejectionDialogOpen} onOpenChange={setIsRejectionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject {approvalType === "space" ? "Host Space" : "Event Request"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Label>Rejection Reason *</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsRejectionDialogOpen(false);
                setRejectionReason("");
              }}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={loading || !rejectionReason.trim()}>
                {loading ? "Rejecting..." : "Reject"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default HostSpaceApprovals;


