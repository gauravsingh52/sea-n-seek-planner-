import { useState, useCallback, useEffect } from "react";
import type { ItineraryData } from "@/types/itinerary";

export interface SavedTrip {
  id: string;
  itinerary: ItineraryData;
  savedAt: string;
}

const STORAGE_KEY = "tripmap_saved_trips";
const MAX_TRIPS = 20;

function readTrips(): SavedTrip[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeTrips(trips: SavedTrip[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trips.slice(0, MAX_TRIPS)));
}

export function useSavedTrips() {
  const [trips, setTrips] = useState<SavedTrip[]>(() => {
    try { return readTrips(); } catch { return []; }
  });

  const saveTrip = useCallback((itinerary: ItineraryData): string => {
    const id = crypto.randomUUID();
    const newTrip: SavedTrip = {
      id,
      itinerary,
      savedAt: new Date().toISOString(),
    };
    const updated = [newTrip, ...readTrips()].slice(0, MAX_TRIPS);
    writeTrips(updated);
    setTrips(updated);
    return id;
  }, []);

  const deleteTrip = useCallback((id: string) => {
    const updated = readTrips().filter((t) => t.id !== id);
    writeTrips(updated);
    setTrips(updated);
  }, []);

  const isSaved = useCallback(
    (itinerary: ItineraryData | null): boolean => {
      if (!itinerary) return false;
      return trips.some(
        (t) => t.itinerary.title === itinerary.title && t.itinerary.totalCost === itinerary.totalCost
      );
    },
    [trips]
  );

  return { trips, saveTrip, deleteTrip, isSaved, count: trips.length };
}
