import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Search, User, Mail, Phone, Calendar, Clock, Loader2, CheckCircle, XCircle, Percent } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getAllQuestionnaireData } from "@/services/questionnaireService";

const MemberQuestionnaireResponses = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: questionnaireData = [], isLoading, error } = useQuery({
    queryKey: ["member-questionnaire-responses"],
    queryFn: getAllQuestionnaireData,
    staleTime: 0,
    cacheTime: 0,
  });

  console.log('MemberQuestionnaireResponses component - isLoading:', isLoading);
  console.log('MemberQuestionnaireResponses component - error:', error);
  console.log('MemberQuestionnaireResponses component - questionnaireData:', questionnaireData);

  const filteredData = questionnaireData.filter((item: any) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.users?.email.toLowerCase().includes(searchLower) ||
      item.users?.full_name?.toLowerCase().includes(searchLower) ||
      item.users?.phone?.includes(searchTerm) ||
      item.name?.toLowerCase().includes(searchLower) ||
      item.city?.toLowerCase().includes(searchLower)
    );
  });

  const calculateCompletionPercentage = (data: any) => {
    const fields = [
      'name', 'pronouns', 'phone_number', 'birthday', 'city', 'social_handles',
      'mood', 'role_in_group', 'interests', 'art_inspiration', 'been_to_gathering',
      'how_found_us', 'why_join_community'
    ];
    
    const filledFields = fields.filter(field => data[field] && data[field].trim() !== '');
    return Math.round((filledFields.length / fields.length) * 100);
  };

  const getPaymentStatusBadge = (membership: any) => {
    if (membership && membership.status === 'active') {
      return <Badge className="bg-green-500 text-white"><CheckCircle className="h-3 w-3 mr-1" />Payment Done</Badge>;
    }
    return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Payment Not Done</Badge>;
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
        <p className="ml-2 text-gray-500">Loading member responses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">Error loading member responses: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Member Questionnaire Responses</h2>
          <p className="text-gray-600">View and analyze member subscription questionnaire responses</p>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Total Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{questionnaireData.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Payment Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {questionnaireData.filter((item: any) => item.membership?.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Payment Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {questionnaireData.filter((item: any) => !item.membership || item.membership.status !== 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Avg Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {questionnaireData.length > 0 
                ? Math.round(questionnaireData.reduce((sum: number, item: any) => sum + calculateCompletionPercentage(item), 0) / questionnaireData.length)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Member Responses</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Completion</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No questionnaire responses found
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item: any) => {
                  const completionPercentage = calculateCompletionPercentage(item);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-500" />
                          </div>
                          <div>
                            <div className="font-medium">{item.name || item.users?.full_name || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{item.users?.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {item.phone_number && (
                            <div className="flex items-center text-sm">
                              <Phone className="h-3 w-3 mr-1" />
                              {item.phone_number}
                            </div>
                          )}
                          {item.social_handles && (
                            <div className="text-sm text-gray-500 truncate max-w-32">
                              {item.social_handles}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {item.city || 'Not specified'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getPaymentStatusBadge(item.membership)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {getCompletionBadge(completionPercentage)}
                          <Progress value={completionPercentage} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          {format(new Date(item.created_at), "MMM dd, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Open detailed view modal
                            console.log('View details for:', item.id);
                          }}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default MemberQuestionnaireResponses;


