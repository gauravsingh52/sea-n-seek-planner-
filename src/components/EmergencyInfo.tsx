import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, Phone } from "lucide-react";
import type { ItineraryData } from "@/types/itinerary";

interface EmergencyData {
  police: string;
  ambulance: string;
  fire?: string;
  tourist?: string;
}

const emergencyNumbers: Record<string, EmergencyData> = {
  india: { police: "100", ambulance: "102", fire: "101", tourist: "1363" },
  usa: { police: "911", ambulance: "911", fire: "911" },
  uk: { police: "999", ambulance: "999", fire: "999" },
  france: { police: "17", ambulance: "15", fire: "18", tourist: "3237" },
  germany: { police: "110", ambulance: "112", fire: "112" },
  italy: { police: "113", ambulance: "118", fire: "115" },
  spain: { police: "091", ambulance: "061", fire: "080" },
  japan: { police: "110", ambulance: "119", fire: "119" },
  thailand: { police: "191", ambulance: "1669", tourist: "1155" },
  australia: { police: "000", ambulance: "000", fire: "000" },
  singapore: { police: "999", ambulance: "995", fire: "995" },
  malaysia: { police: "999", ambulance: "999", fire: "994" },
  indonesia: { police: "110", ambulance: "118", fire: "113" },
  vietnam: { police: "113", ambulance: "115", fire: "114" },
  turkey: { police: "155", ambulance: "112", fire: "110" },
  uae: { police: "999", ambulance: "998", fire: "997" },
  egypt: { police: "122", ambulance: "123", fire: "180", tourist: "126" },
  brazil: { police: "190", ambulance: "192", fire: "193" },
  mexico: { police: "911", ambulance: "911", fire: "911" },
  canada: { police: "911", ambulance: "911", fire: "911" },
  "new zealand": { police: "111", ambulance: "111", fire: "111" },
  greece: { police: "100", ambulance: "166", fire: "199", tourist: "171" },
  switzerland: { police: "117", ambulance: "144", fire: "118" },
  portugal: { police: "112", ambulance: "112", fire: "112" },
  netherlands: { police: "112", ambulance: "112", fire: "112" },
  "south korea": { police: "112", ambulance: "119", fire: "119" },
  china: { police: "110", ambulance: "120", fire: "119" },
  nepal: { police: "100", ambulance: "102", fire: "101" },
  "sri lanka": { police: "119", ambulance: "110", fire: "111" },
};

const countryKeywords: Record<string, string[]> = {
  india: ["delhi", "mumbai", "bangalore", "chennai", "kolkata", "hyderabad", "pune", "jaipur", "goa", "shimla", "manali", "agra", "lucknow", "varanasi", "darjeeling", "kochi", "mysore", "udaipur", "jodhpur", "rishikesh", "amritsar"],
  japan: ["tokyo", "osaka", "kyoto", "hiroshima", "nara", "sapporo", "fukuoka", "nagoya", "yokohama", "kobe"],
  thailand: ["bangkok", "phuket", "chiang mai", "pattaya", "krabi", "koh samui"],
  france: ["paris", "nice", "lyon", "marseille", "bordeaux", "strasbourg"],
  uk: ["london", "edinburgh", "manchester", "birmingham", "glasgow", "liverpool", "oxford", "cambridge"],
  usa: ["new york", "los angeles", "chicago", "san francisco", "las vegas", "miami", "boston", "seattle", "washington", "houston"],
  italy: ["rome", "milan", "florence", "venice", "naples", "turin", "amalfi"],
  spain: ["madrid", "barcelona", "seville", "valencia", "granada", "malaga"],
  germany: ["berlin", "munich", "hamburg", "frankfurt", "cologne", "dresden"],
  australia: ["sydney", "melbourne", "brisbane", "perth", "adelaide", "gold coast"],
  singapore: ["singapore"],
  indonesia: ["bali", "jakarta", "yogyakarta", "lombok"],
  vietnam: ["hanoi", "ho chi minh", "da nang", "hoi an", "halong"],
  uae: ["dubai", "abu dhabi"],
  turkey: ["istanbul", "antalya", "cappadocia", "ankara"],
  greece: ["athens", "santorini", "mykonos", "crete"],
  switzerland: ["zurich", "geneva", "lucerne", "interlaken", "bern"],
  nepal: ["kathmandu", "pokhara"],
  "sri lanka": ["colombo", "kandy", "galle", "ella"],
  brazil: ["rio de janeiro", "são paulo", "brasilia", "salvador"],
  mexico: ["mexico city", "cancun", "tulum", "playa del carmen"],
  canada: ["toronto", "vancouver", "montreal", "calgary", "ottawa"],
  "new zealand": ["auckland", "queenstown", "wellington", "christchurch"],
  "south korea": ["seoul", "busan", "jeju"],
  china: ["beijing", "shanghai", "guangzhou", "shenzhen", "chengdu", "xi'an"],
  egypt: ["cairo", "luxor", "aswan", "alexandria", "sharm el sheikh"],
  malaysia: ["kuala lumpur", "penang", "langkawi", "malacca"],
  portugal: ["lisbon", "porto", "faro"],
  netherlands: ["amsterdam", "rotterdam", "the hague"],
};

function detectCountry(itinerary: ItineraryData): string | null {
  const allPlaces = itinerary.legs
    .flatMap((l) => [l.from, l.to])
    .filter(Boolean)
    .map((p) => p!.toLowerCase());

  for (const [country, cities] of Object.entries(countryKeywords)) {
    if (allPlaces.some((p) => cities.some((c) => p.includes(c)))) {
      return country;
    }
  }
  return null;
}

export function EmergencyInfo({ itinerary }: { itinerary: ItineraryData }) {
  // Use AI-provided emergency info if available
  const aiInfo = itinerary.emergencyInfo;
  const country = detectCountry(itinerary);
  const data = aiInfo || (country ? emergencyNumbers[country] : null);

  if (!data) return null;

  return (
    <Card className="glass-strong gradient-border border-l-[3px] border-l-destructive">
      <CardHeader className="py-3 px-5">
        <CardTitle className="text-sm font-display text-destructive mb-2 flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4" /> Emergency Contacts{country ? ` — ${country.charAt(0).toUpperCase() + country.slice(1)}` : ""}
        </CardTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <EmNum label="Police" number={data.police} />
          <EmNum label="Ambulance" number={data.ambulance} />
          {data.fire && <EmNum label="Fire" number={data.fire} />}
          {data.tourist && <EmNum label="Tourist Help" number={data.tourist} />}
        </div>
      </CardHeader>
    </Card>
  );
}

function EmNum({ label, number }: { label: string; number: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Phone className="w-3 h-3 text-destructive" />
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-bold text-foreground">{number}</div>
      </div>
    </div>
  );
}
