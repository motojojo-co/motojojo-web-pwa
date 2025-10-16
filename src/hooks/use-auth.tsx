import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [isCommunityLead, setIsCommunityLead] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Always upsert user into users table after login/signup
  const upsertUserToTable = async (authUser: any) => {
    if (!authUser) return;
    const { id, email, user_metadata, created_at } = authUser;
    await supabase.from('users').upsert({
      id,
      email,
      full_name: user_metadata?.full_name || '',
      avatar_url: user_metadata?.avatar_url || '',
      created_at: created_at || new Date().toISOString(),
    });
  };

  useEffect(() => {
    let isMounted = true;
    const getSession = async () => {
      setIsLoaded(false);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        setError(sessionError);
        setIsLoaded(true);
        setIsSignedIn(false);
        setUser(null);
        setProfile(null);
        setIsAdmin(false);
        return;
      }
      if (session && session.user) {
        setUser(session.user);
        setIsSignedIn(true);
        // Upsert user into users table
        await upsertUserToTable(session.user);
        // Fetch profile from users table
        const { data, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profileError) {
          setError(profileError);
          setProfile(null);
          setIsAdmin(false);
        } else {
          setProfile(data);
          setIsAdmin(data?.role === 'admin');
          setIsHost(data?.role === 'host');
          setIsCommunityLead(data?.role === 'community_lead');
        }
      } else {
        setUser(null);
        setProfile(null);
        setIsSignedIn(false);
        setIsAdmin(false);
        setIsHost(false);
        setIsCommunityLead(false);
      }
      setIsLoaded(true);
    };
    getSession();
    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      getSession();
    });
    return () => {
      isMounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  // Real-time subscription for profile updates
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`user-profile-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
                  if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          setProfile(payload.new);
          setIsAdmin(payload.new?.role === 'admin');
          setIsHost(payload.new?.role === 'host');
          setIsCommunityLead(payload.new?.role === 'community_lead');
        }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Sign in with email/password
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error);
      return { error };
    }
    // Upsert user after sign in
    if (data?.user) await upsertUserToTable(data.user);
    return { data };
  };

  // Sign up with email/password (user only)
  const signUp = async (email: string, password: string, full_name?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, role: 'user' },
      },
    });
    if (error) {
      setError(error);
      return { error };
    }
    // Upsert user after sign up
    if (data?.user) await upsertUserToTable(data.user);
    return { data };
  };

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setIsSignedIn(false);
    setIsAdmin(false);
    setIsHost(false);
    setIsCommunityLead(false);
  };

  // Invite user (send invite link)
  const inviteUser = async (email: string, role: 'user' | 'admin' | 'community_lead' = 'user') => {
    if ((role === 'admin' || role === 'community_lead') && !isAdmin) {
      throw new Error('Only admins can invite other admins or community leads.');
    }
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, { data: { role } });
    if (error) {
      setError(error);
      return { error };
    }
    return { data };
  };

  // Update profile
  const updateProfile = async (updatedProfile: any) => {
    try {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }
      if (updatedProfile.preferences && typeof updatedProfile.preferences === 'string') {
        try {
          updatedProfile.preferences = JSON.parse(updatedProfile.preferences);
        } catch (e) {
          updatedProfile.preferences = [];
        }
      }
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updatedProfile,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();
      if (error) {
        setError(error);
        throw error;
      }
      setProfile(data);
      return data;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  return {
    user,
    profile,
    isLoaded,
    isSignedIn,
    isAdmin,
    isHost,
    isCommunityLead,
    signIn,
    signUp,
    signOut,
    inviteUser,
    updateProfile,
    error
  };
};
