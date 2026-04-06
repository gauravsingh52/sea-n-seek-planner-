import { useState, useEffect, useRef } from "react";
import type { ItineraryData, WeatherData } from "@/types/itinerary";

const WEATHER_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/weather`;

export function useWeather(itinerary: ItineraryData | null) {
  const [weather, setWeather] = useState<Record<string, WeatherData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const fetchedRef = useRef<string>("");

  useEffect(() => {
    if (!itinerary) return;

    // Extract unique locations with coordinates
    const locations: { lat: number; lng: number; name: string }[] = [];
    const seen = new Set<string>();

    for (const leg of itinerary.legs) {
      if (leg.toCoords && leg.to && !seen.has(leg.to)) {
        seen.add(leg.to);
        locations.push({ lat: leg.toCoords.lat, lng: leg.toCoords.lng, name: leg.to });
      }
      if (leg.fromCoords && leg.from && !seen.has(leg.from)) {
        seen.add(leg.from);
        locations.push({ lat: leg.fromCoords.lat, lng: leg.fromCoords.lng, name: leg.from });
      }
    }

    if (locations.length === 0) return;

    const key = locations.map(l => l.name).sort().join(",");
    if (key === fetchedRef.current) return;
    fetchedRef.current = key;

    setIsLoading(true);
    fetch(WEATHER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ locations }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.weather) setWeather(data.weather);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [itinerary]);

  return { weather, isLoading };
}
