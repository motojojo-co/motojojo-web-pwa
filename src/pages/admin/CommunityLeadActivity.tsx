import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FadeIn } from "@/components/ui/motion";
import { 
  Activity, 
  Users, 
  Calendar, 
  DollarSign, 
  Search,
  Filter,
  TrendingUp,
  MapPin,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { getCommunityLeadActivityForAdmin, getAllCommunityLeads } from "@/services/communityLeadService";

interface CommunityLeadActivity {
  id: string;
  community_lead_id: string;
  activity_type: string;
  activity_description: string;
  event_id?: string;
  metadata: any;
  created_at: string;
  users: {
    id: string;
    full_name: string;
    community_lead_username: string;
    community_lead_city: string;
  };
  events?: {
    id: string;
    title: string;
    city: string;
  };
}

interface CommunityLead {
  id: string;
  full_name: string;
  community_lead_username: string;
  community_lead_city: string;
  community_lead_is_active: boolean;
  community_lead_is_verified: boolean;
  created_at: string;
}

const CommunityLeadActivity = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<string>("all");
  const [activityFilter, setActivityFilter] = useState<string>("all");

  // Fetch all community leads
  const { data: communityLeads = [] } = useQuery({
    queryKey: ["community-leads"],
    queryFn: getAllCommunityLeads,
  });

  // Fetch community lead activity
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["community-lead-activity", selectedLead, activityFilter],
    queryFn: () => getCommunityLeadActivityForAdmin(200),
  });

  // Filter activities based on search and filters
  const filteredActivities = activities.filter((activity: CommunityLeadActivity) => {
    const matchesSearch = searchTerm === "" || 
      activity.activity_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.users.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.users.community_lead_username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (activity.events?.title.toLowerCase().includes(searchTerm.toLowerCase()) || false);

    const matchesLead = selectedLead === "all" || activity.community_lead_id === selectedLead;
    const matchesActivity = activityFilter === "all" || activity.activity_type === activityFilter;

    return matchesSearch && matchesLead && matchesActivity;
  });

  // Get activity type badge variant
  const getActivityBadgeVariant = (activityType: string) => {
    switch (activityType) {
      case 'event_created':
        return 'default';
      case 'event_updated':
        return 'secondary';
      case 'event_assigned':
        return 'outline';
      case 'profile_updated':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  // Get activity type icon
  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'event_created':
        return <Calendar className="w-4 h-4" />;
      case 'event_updated':
        return <Activity className="w-4 h-4" />;
      case 'event_assigned':
        return <Users className="w-4 h-4" />;
      case 'profile_updated':
        return <Users className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  // Get unique activity types for filter
  const activityTypes = [...new Set(activities.map((activity: CommunityLeadActivity) => activity.activity_type))];

  return (
    <div className="space-y-6 text-black">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-black">Community Lead Activity</h2>
          <p className="text-black">Monitor community lead activities and performance</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1 text-black">
            {filteredActivities.length} activities
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-black">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-black">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-black" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-black"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-black">Community Lead</label>
              <select
                value={selectedLead}
                onChange={(e) => setSelectedLead(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 text-black"
              >
                <option value="all">All Community Leads</option>
                {communityLeads.map((lead: CommunityLead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.community_lead_username || lead.full_name} ({lead.community_lead_city})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-black">Activity Type</label>
              <select
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 text-black"
              >
                <option value="all">All Activities</option>
                {activityTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredActivities.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Activity className="w-12 h-12 text-black mx-auto mb-4" />
              <h3 className="text-lg font-medium text-black mb-2">No activities found</h3>
              <p className="text-black">
                {searchTerm || selectedLead !== "all" || activityFilter !== "all"
                  ? "Try adjusting your filters to see more activities."
                  : "Community leads haven't performed any activities yet."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredActivities.map((activity: CommunityLeadActivity) => (
            <FadeIn key={activity.id}>
              <Card className="hover:shadow-md transition-shadow text-black">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-violet/10 rounded-lg flex items-center justify-center">
                        {getActivityIcon(activity.activity_type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-black">
                            {activity.users.community_lead_username || activity.users.full_name}
                          </h3>
                          <Badge variant={getActivityBadgeVariant(activity.activity_type)}>
                            {activity.activity_type.replace('_', ' ').toUpperCase()}
                          </Badge>
                          {activity.users.community_lead_city && (
                            <div className="flex items-center gap-1 text-sm text-black">
                              <MapPin className="w-3 h-3" />
                              {activity.users.community_lead_city}
                            </div>
                          )}
                        </div>
                        <p className="text-black mb-2">{activity.activity_description}</p>
                        {activity.events && (
                          <div className="flex items-center gap-2 text-sm text-black mb-2">
                            <Calendar className="w-4 h-4" />
                            <span className="font-medium">{activity.events.title}</span>
                            <span>•</span>
                            <span>{activity.events.city}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-sm text-black">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(activity.created_at), 'MMM dd, yyyy HH:mm')}
                          </div>
                          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                            <div className="text-xs bg-gray-100 px-2 py-1 rounded text-black">
                              {Object.keys(activity.metadata).length} metadata fields
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          ))
        )}
      </div>
    </div>
  );
};

export default CommunityLeadActivity;
