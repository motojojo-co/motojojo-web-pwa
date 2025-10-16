import { supabase } from "@/integrations/supabase/client";

export interface MembershipSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    phone: string;
  };
  plan: {
    id: string;
    name: string;
    duration_days: number;
  };
}

export const getAllMembershipSubscriptions = async (): Promise<MembershipSubscription[]> => {
  const { data, error } = await supabase
    .from('user_memberships')
    .select(`
      *,
      user:user_id (id, email, full_name, phone),
      plan:plan_id (id, name, duration_days)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching membership subscriptions:', error);
    return [];
  }

  return data as MembershipSubscription[];
};




