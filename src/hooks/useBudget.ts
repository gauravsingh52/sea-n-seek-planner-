import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase';

export interface BudgetItem {
  id: string;
  trip_id: string;
  category: 'accommodation' | 'food' | 'transport' | 'activities' | 'shopping' | 'other';
  description: string;
  amount: number;
  currency: string;
  is_actual: boolean;
  day_number?: number;
  created_at: string;
}

export interface BudgetSummary {
  total_estimated: number;
  total_actual: number;
  by_category: Record<string, { estimated: number; actual: number }>;
}

export const useBudget = () => {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch budget items for a trip
  const fetchBudgetItems = useCallback(async (tripId: string) => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('budget_items')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });

      if (err) throw err;
      setBudgetItems(data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch budget items');
    } finally {
      setLoading(false);
    }
  }, []);

  // Add budget item
  const addBudgetItem = useCallback(
    async (tripId: string, item: Omit<BudgetItem, 'id' | 'trip_id' | 'created_at'>) => {
      try {
        const { data, error: err } = await supabase
          .from('budget_items')
          .insert([{ trip_id: tripId, ...item }])
          .select()
          .single();

        if (err) throw err;
        setBudgetItems((prev) => [data, ...prev]);
        await fetchBudgetSummary(tripId);
        setError(null);
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add budget item');
        return null;
      }
    },
    []
  );

  // Update budget item
  const updateBudgetItem = useCallback(
    async (itemId: string, updates: Partial<BudgetItem>, tripId: string) => {
      try {
        const { data, error: err } = await supabase
          .from('budget_items')
          .update(updates)
          .eq('id', itemId)
          .select()
          .single();

        if (err) throw err;
        setBudgetItems((prev) => prev.map((item) => (item.id === itemId ? data : item)));
        await fetchBudgetSummary(tripId);
        setError(null);
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update budget item');
        return null;
      }
    },
    []
  );

  // Delete budget item
  const deleteBudgetItem = useCallback(
    async (itemId: string, tripId: string): Promise<boolean> => {
      try {
        const { error: err } = await supabase
          .from('budget_items')
          .delete()
          .eq('id', itemId);

        if (err) throw err;
        setBudgetItems((prev) => prev.filter((item) => item.id !== itemId));
        await fetchBudgetSummary(tripId);
        setError(null);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete budget item');
        return false;
      }
    },
    []
  );

  // Fetch budget summary
  const fetchBudgetSummary = useCallback(async (tripId: string) => {
    try {
      const { data, error: err } = await supabase.rpc('get_budget_summary', {
        trip_id_param: tripId,
      });

      if (err) throw err;
      if (data && data.length > 0) {
        setSummary(data[0]);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch budget summary');
    }
  }, []);

  return {
    budgetItems,
    summary,
    loading,
    error,
    fetchBudgetItems,
    addBudgetItem,
    updateBudgetItem,
    deleteBudgetItem,
    fetchBudgetSummary,
  };
};
