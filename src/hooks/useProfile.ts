import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  theme: 'light' | 'dark';
  currency: string;
  language: string;
  notifications_enabled: boolean;
  email_on_share: boolean;
  email_on_mention: boolean;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch profile on mount or when user changes
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    fetchProfile();
  }, [user?.id]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) throw fetchError;
      setProfile(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile';
      setError(errorMessage);
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('No user logged in');

    try {
      setError(null);

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update local state
      setProfile((prev) => (prev ? { ...prev, ...updates } : null));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      throw err;
    }
  };

  const updateTheme = async (theme: 'light' | 'dark') => {
    return updateProfile({ theme });
  };

  const updateCurrency = async (currency: string) => {
    return updateProfile({ currency });
  };

  const updateLanguage = async (language: string) => {
    return updateProfile({ language });
  };

  const updateNotificationPreferences = async (
    notifications_enabled: boolean,
    email_on_share: boolean,
    email_on_mention: boolean
  ) => {
    return updateProfile({
      notifications_enabled,
      email_on_share,
      email_on_mention,
    });
  };

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
    updateTheme,
    updateCurrency,
    updateLanguage,
    updateNotificationPreferences,
  };
};
