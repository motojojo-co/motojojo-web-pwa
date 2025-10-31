import { supabase } from "@/integrations/supabase/client";

export interface CommunityLeadMember {
  id: string;
  user_id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  status: string;
  amount_inr: number;
  created_at: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    phone: string;
    city: string;
  };
  plan: {
    id: string;
    name: string;
    duration_days: number;
  };
  questionnaire?: {
    id: string;
    name: string;
    city: string;
    phone_number: string;
    mood: string;
    role_in_group: string;
    interests: string;
    art_inspiration: string;
    been_to_gathering: string;
    how_found_us: string;
    why_join_community: string;
  };
}

/**
 * Get all members for community lead dashboard
 */
export const getCommunityLeadMembers = async (): Promise<CommunityLeadMember[]> => {
  try {
    console.log('Fetching community lead members...');
    
    // Fetch user_memberships data with user and plan info
    const { data: memberships, error: membershipsError } = await supabase
      .from('user_memberships')
      .select(`
        *,
        users:user_id (
          id,
          email,
          full_name,
          phone,
          city
        ),
        membership_plans:plan_id (
          id,
          name,
          duration_days
        )
      `)
      .order('created_at', { ascending: false });

    if (membershipsError) {
      console.error('Error fetching membership data:', membershipsError);
      return [];
    }

    console.log('Membership data:', memberships);
    
    if (!memberships || memberships.length === 0) {
      console.log('No membership subscriptions found in database');
      return [];
    }

    // Get questionnaire data for each member
    const userIds = memberships.map(m => m.user_id);
    const { data: questionnaireData, error: questionnaireError } = await supabase
      .from('user_subscription_details')
      .select('*')
      .in('user_id', userIds);

    if (questionnaireError) {
      console.error('Error fetching questionnaire data:', questionnaireError);
    }

    // Create questionnaire lookup map
    const questionnaireMap = new Map(
      questionnaireData?.map(q => [q.user_id, q]) || []
    );

    // Transform the data
    const transformedData = memberships.map((membership: any) => ({
      id: membership.id,
      user_id: membership.user_id,
      plan_id: membership.plan_id,
      start_date: membership.start_date,
      end_date: membership.end_date,
      status: membership.status,
      amount_inr: membership.amount_inr,
      created_at: membership.created_at,
      user: membership.users,
      plan: membership.membership_plans,
      questionnaire: questionnaireMap.get(membership.user_id) || undefined,
    }));

    console.log('Transformed membership data:', transformedData);
    return transformedData;
  } catch (error) {
    console.error('Unexpected error fetching community lead members:', error);
    return [];
  }
};

/**
 * Get member statistics for community lead dashboard
 */
export const getCommunityLeadMemberStats = async () => {
  try {
    const members = await getCommunityLeadMembers();
    
    const totalMembers = members.length;
    const activeMembers = members.filter(m => m.status === 'active').length;
    const expiredMembers = members.filter(m => m.status === 'expired').length;
    const totalRevenue = members.reduce((sum, m) => sum + (m.amount_inr || 0), 0);
    
    // Calculate completion rates
    const membersWithQuestionnaire = members.filter(m => m.questionnaire).length;
    const completionRate = totalMembers > 0 ? Math.round((membersWithQuestionnaire / totalMembers) * 100) : 0;
    
    return {
      totalMembers,
      activeMembers,
      expiredMembers,
      totalRevenue,
      completionRate,
      membersWithQuestionnaire,
    };
  } catch (error) {
    console.error('Error calculating member stats:', error);
    return {
      totalMembers: 0,
      activeMembers: 0,
      expiredMembers: 0,
      totalRevenue: 0,
      completionRate: 0,
      membersWithQuestionnaire: 0,
    };
  }
};


