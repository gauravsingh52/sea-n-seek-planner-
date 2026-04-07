import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase';

export interface TravelPreferences {
  preferred_activities?: string[];
  travel_style?: 'luxury' | 'budget' | 'adventure' | 'cultural' | 'relaxation';
  average_budget_per_day?: number;
  preferred_climate?: string[];
  dietary_restrictions?: string[];
  mobility_needs?: string;
  pace?: 'slow' | 'moderate' | 'fast';
  group_size?: number;
  travel_season?: string[];
}

export interface Recommendation {
  id: string;
  trip_id: string;
  recommendation_type: 'activity' | 'restaurant' | 'accommodation' | 'transport' | 'weather_advisory';
  title: string;
  description?: string;
  location?: string;
  price_range?: string;
  rating?: number;
  source?: string;
  relevance_score?: number;
  is_dismissed: boolean;
  created_at: string;
}

export interface DestinationInfo {
  id: string;
  destination: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  best_time_to_visit?: string[];
  avg_temperature_summer?: number;
  avg_temperature_winter?: number;
  currency?: string;
  language?: string[];
  visa_required?: boolean;
  highlights?: string[];
  popular_activities?: string[];
  avg_daily_cost_budget?: number;
  avg_daily_cost_mid?: number;
  avg_daily_cost_luxury?: number;
}

export const useRecommendations = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<TravelPreferences | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user travel preferences
  const fetchPreferences = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error: err } = await supabase
        .from('user_travel_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (err && err.code !== 'PGRST116') throw err;
      setPreferences(data || {});
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch preferences');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Update travel preferences
  const updatePreferences = useCallback(
    async (prefs: TravelPreferences): Promise<boolean> => {
      if (!user) return false;

      try {
        const { data, error: err } = await supabase
          .from('user_travel_preferences')
          .upsert(
            {
              user_id: user.id,
              ...prefs,
            },
            { onConflict: 'user_id' }
          )
          .select()
          .single();

        if (err) throw err;
        setPreferences(data);
        setError(null);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update preferences');
        return false;
      }
    },
    [user]
  );

  // Fetch recommendations for a trip
  const fetchRecommendations = useCallback(
    async (tripId: string): Promise<Recommendation[]> => {
      try {
        const { data, error: err } = await supabase
          .from('trip_recommendations')
          .select('*')
          .eq('trip_id', tripId)
          .eq('is_dismissed', false)
          .order('relevance_score', { ascending: false })
          .limit(20);

        if (err) throw err;
        setRecommendations(data || []);
        setError(null);
        return data || [];
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch recommendations');
        return [];
      }
    },
    []
  );

  // Dismiss a recommendation
  const dismissRecommendation = useCallback(async (recommendationId: string): Promise<boolean> => {
    try {
      const { error: err } = await supabase
        .from('trip_recommendations')
        .update({ is_dismissed: true })
        .eq('id', recommendationId);

      if (err) throw err;
      setRecommendations((prev) => prev.filter((r) => r.id !== recommendationId));
      setError(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dismiss recommendation');
      return false;
    }
  }, []);

  // Save recommendation for later
  const saveRecommendation = useCallback(
    async (recommendationId: string): Promise<boolean> => {
      if (!user) return false;

      try {
        const { error: err } = await supabase.from('user_saved_recommendations').insert([
          {
            user_id: user.id,
            recommendation_id: recommendationId,
          },
        ]);

        if (err && err.code !== '23505') throw err; // Ignore duplicate key error
        setError(null);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save recommendation');
        return false;
      }
    },
    [user]
  );

  // Get destination information
  const getDestinationInfo = useCallback(
    async (destination: string): Promise<DestinationInfo | null> => {
      try {
        const { data, error: err } = await supabase
          .from('destination_info')
          .select('*')
          .ilike('destination', destination)
          .single();

        if (err && err.code !== 'PGRST116') throw err;
        setError(null);
        return data || null;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch destination info');
        return null;
      }
    },
    []
  );

  // Generate basic recommendations
  const generateRecommendations = useCallback(
    async (tripId: string, destination: string): Promise<boolean> => {
      try {
        const recommendations: Partial<Recommendation>[] = [
          {
            trip_id: tripId,
            recommendation_type: 'activity',
            title: 'Explore Local Markets',
            description: 'Visit popular local markets in the area for authentic experiences',
            location: destination,
            relevance_score: 0.95,
            is_dismissed: false,
          },
          {
            trip_id: tripId,
            recommendation_type: 'restaurant',
            title: 'Try Local Cuisine',
            description: 'Sample authentic local dishes at highly-rated restaurants',
            price_range: 'budget',
            rating: 4.8,
            relevance_score: 0.9,
            is_dismissed: false,
          },
          {
            trip_id: tripId,
            recommendation_type: 'weather_advisory',
            title: 'Check Weather Forecast',
            description: 'Check weather forecast and pack appropriate clothing',
            relevance_score: 0.85,
            is_dismissed: false,
          },
        ];

        const { error: err } = await supabase
          .from('trip_recommendations')
          .insert(recommendations as any);

        if (err) throw err;
        setError(null);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate recommendations');
        return false;
      }
    },
    []
  );

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user, fetchPreferences]);

  return {
    preferences,
    recommendations,
    loading,
    error,
    fetchPreferences,
    updatePreferences,
    fetchRecommendations,
    dismissRecommendation,
    saveRecommendation,
    getDestinationInfo,
    generateRecommendations,
  };
};
