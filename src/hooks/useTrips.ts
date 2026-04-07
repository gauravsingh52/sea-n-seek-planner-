import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase';
import type { ItineraryData, ItineraryLeg } from '@/types/itinerary';

export interface Trip {
  id: string;
  user_id: string;
  title: string;
  destination?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  currency: string;
  total_cost: number;
  is_public: boolean;
  share_code?: string;
  created_at: string;
  updated_at: string;
}

export interface TripCollaborator {
  id: string;
  trip_id: string;
  user_id?: string;
  role: 'owner' | 'editor' | 'viewer';
  invited_email?: string;
  accepted_at?: string;
  joined_at: string;
}

export interface TripActivityFeed {
  id: string;
  trip_id: string;
  user_id?: string;
  action: string;
  description: string;
  target_type?: string;
  target_id?: string;
  changes?: any;
  created_at: string;
}

export const useTrips = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all user trips
  const fetchUserTrips = useCallback(async () => {
    if (!user) {
      setTrips([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (err) throw err;
      setTrips(data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trips');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Create new trip
  const createTrip = useCallback(
    async (tripData: Partial<Trip>): Promise<Trip | null> => {
      if (!user) return null;

      try {
        const { data, error: err } = await supabase
          .from('trips')
          .insert([
            {
              ...tripData,
              user_id: user.id,
            },
          ])
          .select()
          .single();

        if (err) throw err;
        setTrips((prev) => [data, ...prev]);
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create trip');
        return null;
      }
    },
    [user]
  );

  // Update trip
  const updateTrip = useCallback(
    async (tripId: string, updates: Partial<Trip>): Promise<Trip | null> => {
      try {
        const { data, error: err } = await supabase
          .from('trips')
          .update(updates)
          .eq('id', tripId)
          .select()
          .single();

        if (err) throw err;
        setTrips((prev) => prev.map((t) => (t.id === tripId ? data : t)));
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update trip');
        return null;
      }
    },
    []
  );

  // Delete trip
  const deleteTrip = useCallback(async (tripId: string): Promise<boolean> => {
    try {
      const { error: err } = await supabase.from('trips').delete().eq('id', tripId);

      if (err) throw err;
      setTrips((prev) => prev.filter((t) => t.id !== tripId));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete trip');
      return false;
    }
  }, []);

  // Share trip (generate share code)
  const shareTrip = useCallback(
    async (tripId: string): Promise<string | null> => {
      try {
        const { data, error: err } = await supabase.rpc('make_trip_shareable', {
          trip_id: tripId,
        });

        if (err) throw err;
        return data as string;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to share trip');
        return null;
      }
    },
    []
  );

  // Add collaborator
  const addCollaborator = useCallback(
    async (tripId: string, email: string, role: 'editor' | 'viewer' = 'viewer') => {
      try {
        const { error: err } = await supabase.from('trip_collaborators').insert([
          {
            trip_id: tripId,
            invited_email: email,
            role,
          },
        ]);

        if (err) throw err;
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to invite collaborator');
        return false;
      }
    },
    []
  );

  // Fetch trip activity
  const fetchTripActivity = useCallback(
    async (tripId: string): Promise<TripActivityFeed[]> => {
      try {
        const { data, error: err } = await supabase
          .from('trip_activity_feed')
          .select('*')
          .eq('trip_id', tripId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (err) throw err;
        return data || [];
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch activity');
        return [];
      }
    },
    []
  );

  // Add itinerary leg
  const addLeg = useCallback(
    async (tripId: string, leg: Partial<ItineraryLeg>): Promise<any | null> => {
      try {
        const { data, error: err } = await supabase
          .from('itinerary_legs')
          .insert([
            {
              trip_id: tripId,
              type: leg.type,
              title: leg.title,
              description: leg.description,
              from_location: leg.from,
              to_location: leg.to,
              from_latitude: leg.fromCoords?.lat,
              from_longitude: leg.fromCoords?.lng,
              to_latitude: leg.toCoords?.lat,
              to_longitude: leg.toCoords?.lng,
              start_time: leg.time,
              cost: leg.cost,
              day_number: leg.day,
              notes: leg.description,
            },
          ])
          .select()
          .single();

        if (err) throw err;
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add leg');
        return null;
      }
    },
    []
  );

  // Update leg
  const updateLeg = useCallback(
    async (legId: string, updates: Partial<ItineraryLeg>): Promise<any | null> => {
      try {
        const { data, error: err } = await supabase
          .from('itinerary_legs')
          .update({
            type: updates.type,
            title: updates.title,
            description: updates.description,
            from_location: updates.from,
            to_location: updates.to,
            cost: updates.cost,
            day_number: updates.day,
          })
          .eq('id', legId)
          .select()
          .single();

        if (err) throw err;
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update leg');
        return null;
      }
    },
    []
  );

  // Delete leg
  const deleteLeg = useCallback(async (legId: string): Promise<boolean> => {
    try {
      const { error: err } = await supabase.from('itinerary_legs').delete().eq('id', legId);

      if (err) throw err;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete leg');
      return false;
    }
  }, []);

  // Fetch trip details with legs
  const fetchTripDetails = useCallback(
    async (tripId: string): Promise<{ trip: Trip; legs: any[] } | null> => {
      try {
        const { data: tripData, error: tripErr } = await supabase
          .from('trips')
          .select('*')
          .eq('id', tripId)
          .single();

        if (tripErr) throw tripErr;

        const { data: legsData, error: legsErr } = await supabase
          .from('itinerary_legs')
          .select('*')
          .eq('trip_id', tripId)
          .order('day_number, order_index');

        if (legsErr) throw legsErr;

        return { trip: tripData, legs: legsData || [] };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch trip details');
        return null;
      }
    },
    []
  );

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel(`trips:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTrips((prev) => [payload.new as Trip, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTrips((prev) => prev.map((t) => (t.id === payload.new.id ? payload.new : t)));
          } else if (payload.eventType === 'DELETE') {
            setTrips((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    fetchUserTrips();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, fetchUserTrips]);

  return {
    trips,
    loading,
    error,
    fetchUserTrips,
    createTrip,
    updateTrip,
    deleteTrip,
    shareTrip,
    addCollaborator,
    fetchTripActivity,
    addLeg,
    updateLeg,
    deleteLeg,
    fetchTripDetails,
  };
};
