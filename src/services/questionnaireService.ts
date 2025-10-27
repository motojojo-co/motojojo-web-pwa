import { supabase } from "@/integrations/supabase/client";

export interface QuestionnaireData {
  name: string;
  pronouns: string;
  phoneNumber: string;
  birthday: string;
  city: string;
  socialHandles: string;
  mood: string;
  roleInGroup: string;
  interests: string;
  artInspiration: string;
  beenToGathering: string;
  howFoundUs: string;
  whyJoinCommunity: string;
}

export interface UserSubscriptionDetails {
  id: string;
  user_id: string;
  membership_id: string | null;
  name: string | null;
  pronouns: string | null;
  phone_number: string | null;
  birthday: string | null;
  city: string | null;
  social_handles: string | null;
  mood: string | null;
  role_in_group: string | null;
  interests: string | null;
  art_inspiration: string | null;
  been_to_gathering: string | null;
  how_found_us: string | null;
  why_join_community: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Save questionnaire data to user_subscription_details table
 */
export const saveQuestionnaireData = async (
  userId: string,
  questionnaireData: QuestionnaireData,
  membershipId?: string
): Promise<{ success: boolean; error?: string; data?: UserSubscriptionDetails }> => {
  try {
    console.log('Saving questionnaire data for user:', userId);
    console.log('Questionnaire data:', questionnaireData);

    const { data, error } = await supabase
      .from('user_subscription_details')
      .insert({
        user_id: userId,
        membership_id: membershipId || null,
        name: questionnaireData.name || null,
        pronouns: questionnaireData.pronouns || null,
        phone_number: questionnaireData.phoneNumber || null,
        birthday: questionnaireData.birthday || null,
        city: questionnaireData.city || null,
        social_handles: questionnaireData.socialHandles || null,
        mood: questionnaireData.mood || null,
        role_in_group: questionnaireData.roleInGroup || null,
        interests: questionnaireData.interests || null,
        art_inspiration: questionnaireData.artInspiration || null,
        been_to_gathering: questionnaireData.beenToGathering || null,
        how_found_us: questionnaireData.howFoundUs || null,
        why_join_community: questionnaireData.whyJoinCommunity || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving questionnaire data:', error);
      return { success: false, error: error.message };
    }

    console.log('Successfully saved questionnaire data:', data);
    return { success: true, data };
  } catch (err: any) {
    console.error('Unexpected error saving questionnaire data:', err);
    return { success: false, error: err.message || 'Failed to save questionnaire data' };
  }
};

/**
 * Update questionnaire data with membership ID after payment
 */
export const updateQuestionnaireWithMembershipId = async (
  userId: string,
  membershipId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Updating questionnaire data with membership ID:', membershipId);

    const { error } = await supabase
      .from('user_subscription_details')
      .update({ membership_id: membershipId })
      .eq('user_id', userId)
      .is('membership_id', null); // Only update records without membership_id

    if (error) {
      console.error('Error updating questionnaire data with membership ID:', error);
      return { success: false, error: error.message };
    }

    console.log('Successfully updated questionnaire data with membership ID');
    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error updating questionnaire data:', err);
    return { success: false, error: err.message || 'Failed to update questionnaire data' };
  }
};

/**
 * Get questionnaire data for a user
 */
export const getQuestionnaireData = async (
  userId: string
): Promise<{ success: boolean; data?: UserSubscriptionDetails; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('user_subscription_details')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching questionnaire data:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || undefined };
  } catch (err: any) {
    console.error('Unexpected error fetching questionnaire data:', err);
    return { success: false, error: err.message || 'Failed to fetch questionnaire data' };
  }
};

/**
 * Get all questionnaire data (admin function)
 */
export const getAllQuestionnaireData = async (): Promise<{
  success: boolean;
  data?: UserSubscriptionDetails[];
  error?: string;
}> => {
  try {
    const { data, error } = await supabase
      .from('user_subscription_details')
      .select(`
        *,
        users:user_id (
          id,
          email,
          full_name,
          phone
        ),
        membership:membership_id (
          id,
          status,
          start_date,
          end_date
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all questionnaire data:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (err: any) {
    console.error('Unexpected error fetching all questionnaire data:', err);
    return { success: false, error: err.message || 'Failed to fetch questionnaire data' };
  }
};
