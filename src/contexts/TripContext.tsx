import { createContext, useContext, useState, ReactNode } from "react";
import type { ItineraryData, ItineraryLeg } from "@/types/itinerary";

interface TripContextType {
  itinerary: ItineraryData | null;
  setItinerary: (data: ItineraryData | null) => void;
  addCustomLeg: (leg: ItineraryLeg) => void;
  reorderLegs: (fromIndex: number, toIndex: number) => void;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export function TripProvider({ children }: { children: ReactNode }) {
  const [itinerary, setItinerary] = useState<ItineraryData | null>(null);

  const addCustomLeg = (leg: ItineraryLeg) => {
    if (!itinerary) return;
    setItinerary({
      ...itinerary,
      legs: [...itinerary.legs, leg],
      totalCost: itinerary.totalCost + leg.cost,
    });
  };

  const reorderLegs = (fromIndex: number, toIndex: number) => {
    if (!itinerary) return;
    const newLegs = [...itinerary.legs];
    const [moved] = newLegs.splice(fromIndex, 1);
    newLegs.splice(toIndex, 0, moved);
    setItinerary({ ...itinerary, legs: newLegs });
  };

  return (
    <TripContext.Provider value={{ itinerary, setItinerary, addCustomLeg, reorderLegs }}>
      {children}
    </TripContext.Provider>
  );
}

export function useTrip() {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error("useTrip must be used within TripProvider");
  return ctx;
}
