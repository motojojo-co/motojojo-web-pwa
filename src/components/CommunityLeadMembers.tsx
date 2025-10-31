import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Search, User, Mail, Phone, Calendar, Clock, Loader2, CheckCircle, XCircle, MapPin, Heart, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getCommunityLeadMembers, getCommunityLeadMemberStats } from "@/services/communityLeadMemberService";

const CommunityLeadMembers = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["community-lead-members"],
    queryFn: getCommunityLeadMembers,
  });

  const { data: stats } = useQuery({
    queryKey: ["community-lead-member-stats"],
    queryFn: getCommunityLeadMemberStats,
  });

  const filteredMembers = members.filter((member) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      member.user?.email.toLowerCase().includes(searchLower) ||
      member.user?.full_name?.toLowerCase().includes(searchLower) ||
      member.user?.phone?.includes(searchTerm) ||
      member.user?.city?.toLowerCase().includes(searchLower) ||
      member.questionnaire?.name?.toLowerCase().includes(searchLower)
    );
  });

  const calculateCompletionPercentage = (member: any) => {
    if (!member.questionnaire) return 0;
    
    const fields = [
      'name', 'pronouns', 'phone_number', 'birthday', 'city', 'social_handles',
      'mood', 'role_in_group', 'interests', 'art_inspiration', 'been_to_gathering',
      'how_found_us', 'why_join_community'
    ];
    
    const filledFields = fields.filter(field => 
      member.questionnaire[field] && member.questionnaire[field].trim() !== ''
    );
    return Math.round((filledFields.length / fields.length) * 100);
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-500 text-white"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case 'expired':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Expired</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 text-black"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCompletionBadge = (percentage: number) => {
    if (percentage >= 80) {
      return <Badge className="bg-green-500 text-white">{percentage}% Complete</Badge>;
    } else if (percentage >= 50) {
      return <Badge className="bg-yellow-500 text-black">{percentage}% Complete</Badge>;
    } else {
      return <Badge variant="destructive">{percentage}% Complete</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
        <p className="ml-2 text-gray-500">Loading members...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Community Members</h2>
          <p className="text-gray-600">View and manage your community members</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMembers || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Active Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.activeMembers || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.expiredMembers || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats?.totalRevenue?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Profile Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completionRate || 0}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No members found</p>
          </div>
        ) : (
          filteredMembers.map((member) => {
            const completionPercentage = calculateCompletionPercentage(member);
            return (
              <Card key={member.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-yellow to-orange-400 flex items-center justify-center">
                        <User className="h-5 w-5 text-black" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {member.questionnaire?.name || member.user?.full_name || 'Anonymous'}
                        </CardTitle>
                        <p className="text-sm text-gray-500">{member.user?.email}</p>
                      </div>
                    </div>
                    {getStatusBadge(member.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Contact Info */}
                  <div className="space-y-2">
                    {member.questionnaire?.phone_number && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        {member.questionnaire.phone_number}
                      </div>
                    )}
                    {member.questionnaire?.city && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        {member.questionnaire.city}
                      </div>
                    )}
                  </div>

                  {/* Membership Info */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Membership Plan</div>
                    <div className="font-medium">{member.plan?.name || 'Unknown Plan'}</div>
                    <div className="text-sm text-gray-500">
                      ₹{member.amount_inr?.toLocaleString()} • {member.plan?.duration_days} days
                    </div>
                  </div>

                  {/* Questionnaire Completion */}
                  {member.questionnaire ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Profile Completion</span>
                        {getCompletionBadge(completionPercentage)}
                      </div>
                      <Progress value={completionPercentage} className="h-2" />
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <Badge variant="outline" className="text-gray-500">
                        No questionnaire data
                      </Badge>
                    </div>
                  )}

                  {/* Member Insights */}
                  {member.questionnaire && (
                    <div className="space-y-2">
                      {member.questionnaire.mood && (
                        <div className="text-sm">
                          <span className="text-gray-600">Mood: </span>
                          <span className="font-medium">{member.questionnaire.mood}</span>
                        </div>
                      )}
                      {member.questionnaire.role_in_group && (
                        <div className="text-sm">
                          <span className="text-gray-600">Role: </span>
                          <span className="font-medium">{member.questionnaire.role_in_group}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Join Date */}
                  <div className="flex items-center text-sm text-gray-500 pt-2 border-t">
                    <Calendar className="h-4 w-4 mr-2" />
                    Joined {format(new Date(member.created_at), "MMM dd, yyyy")}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CommunityLeadMembers;


