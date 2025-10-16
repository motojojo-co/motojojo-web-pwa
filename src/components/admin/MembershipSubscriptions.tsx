import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Search, User, Mail, Phone, Calendar, Clock, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getAllMembershipSubscriptions } from "@/services/adminMembershipService";

const MembershipSubscriptions = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ["membership-subscriptions"],
    queryFn: getAllMembershipSubscriptions,
  });

  const filteredSubscriptions = subscriptions.filter(subscription => {
    const searchLower = searchTerm.toLowerCase();
    return (
      subscription.user?.email.toLowerCase().includes(searchLower) ||
      subscription.user?.full_name?.toLowerCase().includes(searchLower) ||
      subscription.user?.phone?.includes(searchTerm) ||
      subscription.plan?.name.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'default';
      case 'expired':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Membership Subscriptions</h2>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search members..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubscriptions.length > 0 ? (
              filteredSubscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{subscription.user?.full_name || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{subscription.user?.email || 'N/A'}</span>
                      </div>
                      {subscription.user?.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{subscription.user.phone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span>{subscription.plan?.name || 'N/A'}</span>
                      {subscription.plan?.duration_days && (
                        <Badge variant="outline">
                          {subscription.plan.duration_days} days
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {subscription.start_date
                          ? format(new Date(subscription.start_date), 'MMM d, yyyy')
                          : 'N/A'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {subscription.end_date
                          ? format(new Date(subscription.end_date), 'MMM d, yyyy')
                          : 'N/A'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(subscription.status)}>
                      {subscription.status || 'Unknown'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No membership subscriptions found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default MembershipSubscriptions;
