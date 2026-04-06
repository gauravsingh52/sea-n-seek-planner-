import { useMemo } from "react";
import { Compass, Repeat, Sparkles, Map } from "lucide-react";
import type { GeoSuggestion } from "@/hooks/useGeoSuggestions";
import type { ChatSession } from "@/hooks/useChatHistory";

const DESTINATION_KEYWORDS = [
  "Paris", "London", "Tokyo", "Delhi", "Mumbai", "Goa", "Bali", "Bangkok",
  "New York", "Dubai", "Rome", "Barcelona", "Istanbul", "Sydney", "Seoul",
  "Singapore", "Kyoto", "Osaka", "Berlin", "Amsterdam", "Prague", "Vienna",
  "Lisbon", "Athens", "Cairo", "Cape Town", "Marrakech", "Cancún", "Cusco",
  "Rio", "Buenos Aires", "Hanoi", "Phuket", "Chiang Mai", "Jaipur", "Udaipur",
  "Manali", "Kerala", "Shimla", "Rishikesh", "Varanasi", "Agra", "Leh",
  "Maldives", "Sri Lanka", "Nepal", "Switzerland", "Italy", "Spain", "France",
  "Japan", "Thailand", "Vietnam", "Mexico", "Peru", "Greece", "Turkey",
  "Morocco", "Kenya", "Tanzania", "Australia", "New Zealand", "Hawaii",
  "Alaska", "Iceland", "Norway", "Portugal", "Croatia", "Montenegro",
];

function extractDestinations(sessions: ChatSession[]): string[] {
  const found: string[] = [];
  const seen = new Set<string>();

  for (const session of sessions.slice(0, 10)) {
    const text = [
      session.title,
      ...session.messages
        .filter((m) => m.role === "user")
        .slice(0, 3)
        .map((m) => m.content),
    ].join(" ");

    for (const dest of DESTINATION_KEYWORDS) {
      if (!seen.has(dest) && text.toLowerCase().includes(dest.toLowerCase())) {
        seen.add(dest);
        found.push(dest);
      }
    }
    if (found.length >= 6) break;
  }
  return found;
}

export function useSmartSuggestions(
  sessions: ChatSession[],
  geoSuggestions: GeoSuggestion[],
  geoLoading: boolean
): { suggestions: GeoSuggestion[]; label: string } {
  return useMemo(() => {
    if (geoLoading) return { suggestions: geoSuggestions, label: "" };

    const destinations = extractDestinations(sessions);

    if (destinations.length === 0) {
      return { suggestions: geoSuggestions, label: "" };
    }

    // Limit to 1 history card so location-based suggestions stay dominant
    const historyCards: GeoSuggestion[] = destinations.slice(0, 1).map((dest) => ({
      icon: Repeat,
      text: `Explore ${dest} again with a different vibe`,
    }));

    const geoCards = geoSuggestions
      .filter((g) => !historyCards.some((h) => h.text.includes(g.text.split(" ")[0])))
      .slice(0, 4 - historyCards.length);

    return {
      suggestions: [...historyCards, ...geoCards],
      label: "✨ Personalized for you",
    };
  }, [sessions, geoSuggestions, geoLoading]);
}
