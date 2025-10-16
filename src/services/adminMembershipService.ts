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
  try {
    console.log('Fetching membership subscriptions...');
    
    // Fetch user_memberships data
    const { data: memberships, error: membershipsError } = await supabase
      .from('user_memberships')
      .select('*')
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

    // Get unique user IDs and plan IDs
    const userIds = [...new Set(memberships.map(m => m.user_id))];
    const planIds = [...new Set(memberships.map(m => m.plan_id))];

    // Fetch users data
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, full_name, phone')
      .in('id', userIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
    }

    // Fetch membership plans data
    const { data: plans, error: plansError } = await supabase
      .from('membership_plans')
      .select('id, name, duration_days')
      .in('id', planIds);

    if (plansError) {
      console.error('Error fetching plans:', plansError);
    }

    console.log('Users data:', users);
    console.log('Plans data:', plans);

    // Create lookup maps
    const usersMap = new Map(users?.map(user => [user.id, user]) || []);
    const plansMap = new Map(plans?.map(plan => [plan.id, plan]) || []);

    console.log('Users map:', usersMap);
    console.log('Plans map:', plansMap);
    console.log('Sample membership:', memberships[0]);

    // Transform the data
    const transformedData = memberships.map(membership => {
      const user = usersMap.get(membership.user_id);
      const plan = plansMap.get(membership.plan_id);
      
      console.log(`Processing membership ${membership.id}:`);
      console.log(`  - User ID: ${membership.user_id}, Found user:`, user);
      console.log(`  - Plan ID: ${membership.plan_id}, Found plan:`, plan);
      
      return {
        id: membership.id,
        user_id: membership.user_id,
        plan_id: membership.plan_id,
        start_date: membership.start_date,
        end_date: membership.end_date,
        status: membership.status,
        created_at: membership.created_at,
        user: user || null,
        plan: plan || null
      };
    });

    console.log('Transformed membership subscriptions:', transformedData);
    console.log('Number of transformed subscriptions:', transformedData.length);
    return transformedData;
  } catch (err) {
    console.error('Exception in getAllMembershipSubscriptions:', err);
    return [];
  }
};

export interface MembershipPlan {
  id: string;
  name: string;
  price_inr: number;
  duration_days: number;
  is_active: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export const getAllMembershipPlans = async (): Promise<MembershipPlan[]> => {
  const { data, error } = await supabase
    .from('membership_plans')
    .select('id, name, price_inr, duration_days, is_active, description, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching membership plans:', error);
    return [];
  }

  return (data || []) as MembershipPlan[];
};

export interface CreateMembershipPlanData {
  name: string;
  price_inr: number;
  duration_days: number;
  description?: string;
  is_active?: boolean;
}

export interface UpdateMembershipPlanData {
  name?: string;
  price_inr?: number;
  duration_days?: number;
  description?: string;
  is_active?: boolean;
}

export const createMembershipPlan = async (data: CreateMembershipPlanData): Promise<MembershipPlan | null> => {
  try {
    const { data: newPlan, error } = await supabase
      .from('membership_plans')
      .insert({
        name: data.name,
        price_inr: data.price_inr,
        duration_days: data.duration_days,
        description: data.description || null,
        is_active: data.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating membership plan:', error);
      return null;
    }

    return newPlan as MembershipPlan;
  } catch (err) {
    console.error('Exception in createMembershipPlan:', err);
    return null;
  }
};

export const updateMembershipPlan = async (id: string, data: UpdateMembershipPlanData): Promise<MembershipPlan | null> => {
  try {
    const { data: updatedPlan, error } = await supabase
      .from('membership_plans')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating membership plan:', error);
      return null;
    }

    return updatedPlan as MembershipPlan;
  } catch (err) {
    console.error('Exception in updateMembershipPlan:', err);
    return null;
  }
};

export const deleteMembershipPlan = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('membership_plans')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting membership plan:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Exception in deleteMembershipPlan:', err);
    return false;
  }
};

// Test function to debug the issue
export const testMembershipData = async () => {
  console.log('Testing membership data fetch...');
  
  // Test 1: Basic user_memberships query
  const { data: memberships, error: membershipsError } = await supabase
    .from('user_memberships')
    .select('*')
    .limit(5);
  
  console.log('Test 1 - Basic user_memberships:', { memberships, membershipsError });
  
  // Test 2: Users table
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, full_name, phone')
    .limit(5);
  
  console.log('Test 2 - Users table:', { users, usersError });
  
  // Test 3: Membership plans table
  const { data: plans, error: plansError } = await supabase
    .from('membership_plans')
    .select('id, name, duration_days')
    .limit(5);
  
  console.log('Test 3 - Membership plans:', { plans, plansError });
  
  return { memberships, users, plans };
};




