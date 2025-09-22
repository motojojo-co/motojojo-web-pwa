import { supabase } from "@/integrations/supabase/client";

export type ActiveMembership = {
  hasActive: boolean;
  endDate?: string;
  planName?: string;
  durationDays?: number;
};

export const getActiveMembership = async (userId: string): Promise<ActiveMembership> => {
  if (!userId) return { hasActive: false };

  const { data, error } = await supabase
    .from("user_memberships")
    .select(
      `start_date, end_date, status, membership_plans:plan_id ( name, duration_days )`
    )
    .eq("user_id", userId)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return { hasActive: false };

  const now = new Date();
  const end = data.end_date ? new Date(data.end_date) : null;
  const statusOk = data.status?.toLowerCase() === "active";
  const inWindow = end ? end >= now : false;

  if (statusOk && inWindow) {
    return {
      hasActive: true,
      endDate: data.end_date || undefined,
      planName: (data as any).membership_plans?.name,
      durationDays: (data as any).membership_plans?.duration_days,
    };
  }

  return { hasActive: false };
};

export const getPlanByName = async (name: string): Promise<{ id: string; name: string; duration_days: number } | null> => {
  const { data, error } = await supabase
    .from("membership_plans")
    .select("id, name, duration_days")
    .eq("name", name)
    .eq("is_active", true)
    .maybeSingle();
  if (error || !data) return null;
  return data as any;
};

export const createUserMembership = async (args: {
  userId: string;
  planId: string;
  amountInr: number;
  paymentId: string;
}): Promise<boolean> => {
  const start = new Date();
  const { data: plan } = await supabase
    .from("membership_plans")
    .select("duration_days")
    .eq("id", args.planId)
    .maybeSingle();

  const end = new Date(start);
  const durationDays = plan?.duration_days ?? 90;
  end.setDate(end.getDate() + durationDays);

  const { error } = await supabase.from("user_memberships").insert({
    user_id: args.userId,
    plan_id: args.planId,
    amount_inr: args.amountInr,
    payment_id: args.paymentId,
    start_date: start.toISOString(),
    end_date: end.toISOString(),
    status: "active",
  });

  return !error;
};


