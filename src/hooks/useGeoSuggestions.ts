import { useState, useEffect } from "react";
import { Ship, Train, Car, Palmtree } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface GeoSuggestion {
  icon: LucideIcon;
  text: string;
}

interface GeoResult {
  suggestions: GeoSuggestion[];
  locationLabel: string;
  isLoading: boolean;
  countryCode: string;
}

const FALLBACK: GeoSuggestion[] = [
  { icon: Ship, text: "Plan a ferry trip from Barcelona to Ibiza with hotels" },
  { icon: Train, text: "Compare bullet trains vs flights from Tokyo to Osaka" },
  { icon: Car, text: "Road trip itinerary along the California coast" },
  { icon: Palmtree, text: "Plan a budget island-hopping trip in Bali" },
];

const COUNTRY_PROMPTS: Record<string, GeoSuggestion[]> = {
  IN: [
    { icon: Car, text: "Weekend getaway from {city} to Manali via scenic hill roads" },
    { icon: Ship, text: "Kerala backwater houseboat cruise from Alleppey to Kumarakom" },
    { icon: Car, text: "Rajasthan palace tour: Delhi → Jaipur → Udaipur → Jodhpur" },
    { icon: Train, text: "Darjeeling Himalayan Railway toy train experience" },
  ],
  US: [
    { icon: Car, text: "Pacific Coast Highway road trip from LA to San Francisco" },
    { icon: Train, text: "Amtrak scenic route from New York to Washington DC" },
    { icon: Palmtree, text: "Hawaii island-hopping: Oahu, Maui & Big Island" },
    { icon: Car, text: "Historic Route 66 road trip from Chicago to Santa Monica" },
  ],
  GB: [
    { icon: Car, text: "Scottish Highlands road trip: Edinburgh to Isle of Skye" },
    { icon: Train, text: "London to Edinburgh on the LNER east coast line" },
    { icon: Palmtree, text: "Lake District weekend retreat with hiking trails" },
    { icon: Ship, text: "Channel Islands ferry trip from Poole to Jersey & Guernsey" },
  ],
  JP: [
    { icon: Train, text: "Shinkansen bullet train tour: Tokyo → Kyoto → Osaka" },
    { icon: Palmtree, text: "Okinawa tropical island hopping with beach resorts" },
    { icon: Car, text: "Hokkaido scenic road trip through Furano & Biei" },
    { icon: Car, text: "Mt Fuji day trip from Tokyo with lake views" },
  ],
  AU: [
    { icon: Car, text: "Great Ocean Road drive from Melbourne to the 12 Apostles" },
    { icon: Train, text: "Sydney to Melbourne XPT coastal rail journey" },
    { icon: Palmtree, text: "Whitsunday Islands sailing and snorkeling trip" },
    { icon: Car, text: "Red Centre outback road trip: Alice Springs to Uluru" },
  ],
  TH: [
    { icon: Train, text: "Overnight sleeper train from Bangkok to Chiang Mai" },
    { icon: Palmtree, text: "Krabi island hopping: Railay, Koh Phi Phi & Koh Lanta" },
    { icon: Car, text: "Ayutthaya ancient temples day trip from Bangkok" },
    { icon: Ship, text: "Phuket to Koh Samui coastal ferry adventure" },
  ],
  DE: [
    { icon: Train, text: "ICE high-speed train from Berlin to Munich via Nuremberg" },
    { icon: Car, text: "Romantic Road drive from Würzburg to Füssen" },
    { icon: Ship, text: "Rhine river cruise from Cologne to Koblenz" },
    { icon: Palmtree, text: "Black Forest hiking and spa retreat" },
  ],
  FR: [
    { icon: Train, text: "TGV from Paris to Nice along the French Riviera" },
    { icon: Car, text: "Loire Valley château road trip from Tours" },
    { icon: Ship, text: "Corsica ferry from Nice with coastal village tour" },
    { icon: Palmtree, text: "Provence lavender fields and wine tasting trip" },
  ],
  IT: [
    { icon: Train, text: "High-speed Frecciarossa from Rome to Florence" },
    { icon: Car, text: "Amalfi Coast road trip from Naples to Positano" },
    { icon: Ship, text: "Venice to Croatian coast ferry adventure" },
    { icon: Palmtree, text: "Tuscany wine country cycling tour" },
  ],
  ES: [
    { icon: Train, text: "AVE high-speed train from Madrid to Barcelona" },
    { icon: Car, text: "Andalusia road trip: Seville → Granada → Málaga" },
    { icon: Ship, text: "Ibiza and Mallorca island-hopping ferry trip" },
    { icon: Palmtree, text: "Camino de Santiago walking pilgrimage" },
  ],
  CA: [
    { icon: Car, text: "Icefields Parkway drive from Banff to Jasper" },
    { icon: Train, text: "Rocky Mountaineer scenic rail from Vancouver to Banff" },
    { icon: Palmtree, text: "Whistler adventure getaway with skiing and hiking" },
    { icon: Ship, text: "BC Ferries to Vancouver Island and Tofino" },
  ],
  BR: [
    { icon: Car, text: "Rio to Paraty coastal road trip with beach stops" },
    { icon: Palmtree, text: "Fernando de Noronha island paradise trip" },
    { icon: Ship, text: "Amazon river cruise from Manaus" },
    { icon: Train, text: "Serra Verde Express through Atlantic rainforest" },
  ],
  MX: [
    { icon: Car, text: "Yucatán road trip: Cancún → Tulum → Mérida" },
    { icon: Palmtree, text: "Oaxaca food and mezcal cultural tour" },
    { icon: Ship, text: "Baja California whale watching cruise" },
    { icon: Train, text: "Copper Canyon Chepe train through Sierra Madre" },
  ],
  KR: [
    { icon: Train, text: "KTX from Seoul to Busan with temple stays" },
    { icon: Car, text: "Jeju Island scenic road trip around the coast" },
    { icon: Palmtree, text: "Gyeongju ancient capital and cherry blossoms" },
    { icon: Ship, text: "Island hopping in the South Sea near Tongyeong" },
  ],
  NZ: [
    { icon: Car, text: "South Island road trip: Queenstown to Milford Sound" },
    { icon: Palmtree, text: "Bay of Islands sailing and dolphin swimming" },
    { icon: Train, text: "TranzAlpine rail across the Southern Alps" },
    { icon: Ship, text: "Interislander ferry between North and South Island" },
  ],
  EG: [
    { icon: Ship, text: "Nile cruise from Luxor to Aswan with temple visits" },
    { icon: Car, text: "Red Sea diving road trip: Hurghada to Marsa Alam" },
    { icon: Palmtree, text: "Siwa Oasis desert adventure from Cairo" },
    { icon: Train, text: "Cairo to Alexandria Mediterranean express" },
  ],
  TR: [
    { icon: Car, text: "Turquoise Coast road trip: Antalya → Fethiye → Bodrum" },
    { icon: Palmtree, text: "Cappadocia hot air balloon and cave hotel stay" },
    { icon: Ship, text: "Bosphorus cruise and Istanbul old city walking tour" },
    { icon: Train, text: "Eastern Express from Ankara to Kars in winter" },
  ],
  ZA: [
    { icon: Car, text: "Garden Route drive from Cape Town to Port Elizabeth" },
    { icon: Palmtree, text: "Kruger National Park safari adventure" },
    { icon: Ship, text: "Cape Town harbour cruise to Robben Island" },
    { icon: Train, text: "Blue Train luxury journey from Pretoria to Cape Town" },
  ],
};

const REGION_PROMPTS: Record<string, GeoSuggestion[]> = {
  EU: [
    { icon: Ship, text: "Plan a Channel ferry trip from Dover to Calais with hotels" },
    { icon: Train, text: "Eurostar journey from London to Paris with day trips" },
    { icon: Palmtree, text: "Mediterranean island hopping: Santorini, Mykonos & Crete" },
    { icon: Car, text: "Alpine road trip through Switzerland and Austria" },
  ],
  NA: [
    { icon: Car, text: "Road trip along the California coast from LA to San Francisco" },
    { icon: Ship, text: "Caribbean cruise itinerary: Bahamas, Jamaica & Cozumel" },
    { icon: Train, text: "Cross-country Amtrak trip from New York to Los Angeles" },
    { icon: Palmtree, text: "Beach-hopping in Cancún and the Riviera Maya" },
  ],
  AS: [
    { icon: Train, text: "Bullet train tour from Tokyo to Kyoto to Osaka" },
    { icon: Palmtree, text: "Island hopping in Thailand: Phuket, Koh Phi Phi & Krabi" },
    { icon: Car, text: "Golden Triangle road trip: Delhi, Agra & Jaipur" },
    { icon: Ship, text: "Ferry trip through Ha Long Bay in Vietnam" },
  ],
  SA: [
    { icon: Car, text: "Patagonia road trip from Buenos Aires to Ushuaia" },
    { icon: Ship, text: "Amazon river cruise from Manaus to Belém" },
    { icon: Palmtree, text: "Galápagos Islands hopping itinerary from Quito" },
    { icon: Train, text: "Peru rail journey to Machu Picchu from Cusco" },
  ],
  OC: [
    { icon: Car, text: "New Zealand South Island road trip: Queenstown to Milford Sound" },
    { icon: Palmtree, text: "Fiji island-hopping trip with beach resorts" },
    { icon: Ship, text: "Sydney to Tasmania ferry and coastal tour" },
    { icon: Train, text: "Great Southern rail journey across Australia" },
  ],
  AF: [
    { icon: Car, text: "Safari route from Nairobi to Masai Mara and Serengeti" },
    { icon: Ship, text: "Morocco coastal trip from Tangier to Essaouira" },
    { icon: Train, text: "Blue Train luxury journey from Pretoria to Cape Town" },
    { icon: Palmtree, text: "Zanzibar and Dar es Salaam beach & culture trip" },
  ],
};

// City alias map for obscure/small detected cities → nearest major city
const CITY_ALIASES: Record<string, string> = {
  "Basi": "Jalandhar", "Phillaur": "Jalandhar", "Nakodar": "Jalandhar",
  "Mohali": "Chandigarh", "Zirakpur": "Chandigarh", "Panchkula": "Chandigarh",
  "Kharar": "Chandigarh", "Dera Bassi": "Chandigarh",
  "Khanna": "Ludhiana", "Samrala": "Ludhiana", "Doraha": "Ludhiana",
  "Rajpura": "Patiala", "Nabha": "Patiala",
  "Batala": "Amritsar", "Ajnala": "Amritsar",
  "Moga": "Ludhiana", "Abohar": "Bathinda", "Fazilka": "Bathinda",
};

// Indian state-level prompts
const STATE_PROMPTS: Record<string, GeoSuggestion[]> = {
  "Punjab": [
    { icon: Car, text: "Golden Temple & Jallianwala Bagh heritage walk in Amritsar" },
    { icon: Car, text: "Weekend getaway from {city} to Shimla via Chandigarh" },
    { icon: Palmtree, text: "Wagah Border ceremony & Amritsar food trail day trip" },
    { icon: Train, text: "Dharamshala & McLeodganj hill station trip from {city}" },
  ],
  "Himachal Pradesh": [
    { icon: Car, text: "Manali to Leh road trip via Rohtang Pass" },
    { icon: Palmtree, text: "Kasol & Kheerganga trek with riverside camping" },
    { icon: Train, text: "Kalka-Shimla toy train heritage ride" },
    { icon: Car, text: "Spiti Valley circuit: Shimla → Kaza → Manali" },
  ],
  "Rajasthan": [
    { icon: Car, text: "Royal Rajasthan road trip: Jaipur → Udaipur → Jodhpur → Jaisalmer" },
    { icon: Train, text: "Palace on Wheels luxury train experience" },
    { icon: Palmtree, text: "Desert safari and camping in Jaisalmer sand dunes" },
    { icon: Car, text: "Pushkar camel fair & Ajmer Sharif day trip from {city}" },
  ],
  "Kerala": [
    { icon: Ship, text: "Alleppey houseboat cruise through Kerala backwaters" },
    { icon: Car, text: "Munnar tea plantations & Thekkady wildlife trip" },
    { icon: Palmtree, text: "Varkala cliff beach & Kovalam surfing getaway" },
    { icon: Car, text: "Wayanad treehouse stay & Edakkal caves trek" },
  ],
  "Goa": [
    { icon: Palmtree, text: "North Goa beach hopping: Baga, Anjuna & Vagator" },
    { icon: Ship, text: "Dudhsagar Falls & spice plantation day trip" },
    { icon: Car, text: "South Goa hidden beaches & Portuguese heritage trail" },
    { icon: Palmtree, text: "Goa food trail: seafood shacks & feni tasting" },
  ],
  "Jammu and Kashmir": [
    { icon: Car, text: "Srinagar to Leh road trip via Sonamarg & Zoji La" },
    { icon: Palmtree, text: "Dal Lake shikara ride & Mughal Gardens walk in Srinagar" },
    { icon: Car, text: "Gulmarg skiing & gondola ride weekend trip" },
    { icon: Train, text: "Pahalgam valley trek & Betaab Valley day trip" },
  ],
  "Uttar Pradesh": [
    { icon: Car, text: "Taj Mahal sunrise & Agra Fort heritage day trip" },
    { icon: Train, text: "Varanasi ghats & spiritual Ganga Aarti experience" },
    { icon: Car, text: "Lucknow food trail: kebabs, biryanis & chaat" },
    { icon: Palmtree, text: "Vrindavan & Mathura temple circuit from {city}" },
  ],
  "Maharashtra": [
    { icon: Car, text: "Mumbai to Lonavala & Khandala hill station drive" },
    { icon: Ship, text: "Alibaug beach getaway with Kolaba Fort ferry" },
    { icon: Car, text: "Ajanta & Ellora caves heritage road trip" },
    { icon: Palmtree, text: "Mahabaleshwar & Panchgani strawberry farm trip" },
  ],
  "Karnataka": [
    { icon: Car, text: "Coorg coffee estate stay & Abbey Falls trek" },
    { icon: Train, text: "Hampi ancient ruins & boulder landscape trip" },
    { icon: Palmtree, text: "Gokarna beach trek: Om Beach to Half Moon Beach" },
    { icon: Car, text: "Mysore Palace & Chamundi Hills day trip from Bangalore" },
  ],
  "Tamil Nadu": [
    { icon: Car, text: "Pondicherry French Quarter & Auroville day trip" },
    { icon: Train, text: "Nilgiri Mountain Railway to Ooty from Mettupalayam" },
    { icon: Palmtree, text: "Rameswaram temple island & Dhanushkodi ghost town" },
    { icon: Car, text: "Kodaikanal hill station & Berijam Lake trek" },
  ],
};

interface GeoData {
  city: string;
  country: string;
  countryCode: string;
  continent: string;
  state: string;
}

async function tryProvider(url: string, normalize: (d: any) => GeoData | null, signal: AbortSignal): Promise<GeoData | null> {
  try {
    const r = await fetch(url, { signal });
    if (!r.ok) return null;
    const data = await r.json();
    return normalize(data);
  } catch {
    return null;
  }
}

const PROVIDERS: { url: string; normalize: (d: any) => GeoData | null }[] = [
  {
    url: "https://ipwho.is/",
    normalize: (d) => d.success === false ? null : ({
      city: d.city || "",
      country: d.country || "",
      countryCode: d.country_code || "",
      continent: d.continent_code || "",
      state: d.region || "",
    }),
  },
  {
    url: "https://ip-api.com/json/?fields=status,country,countryCode,city,continentCode,regionName",
    normalize: (d) => d.status !== "success" ? null : ({
      city: d.city || "",
      country: d.country || "",
      countryCode: d.countryCode || "",
      continent: d.continentCode || "",
      state: d.regionName || "",
    }),
  },
  {
    url: "https://api.ipapi.is/",
    normalize: (d) => (!d.location ? null : ({
      city: d.location?.city || "",
      country: d.location?.country || "",
      countryCode: d.location?.country_code || "",
      continent: d.location?.continent || "",
      state: d.location?.state || d.location?.region || "",
    })),
  },
];

const LANG_TO_COUNTRY: Record<string, string> = {
  hi: "IN", bn: "IN", ta: "IN", te: "IN", mr: "IN", gu: "IN", kn: "IN", ml: "IN", pa: "IN",
  ja: "JP", ko: "KR", de: "DE", fr: "FR", es: "ES", it: "IT", pt: "BR", tr: "TR",
  ar: "EG", th: "TH", vi: "VN", zh: "CN", nl: "NL", pl: "PL", ru: "RU",
};

function guessCountryFromLanguage(): string {
  const lang = (navigator.language || "").split("-");
  if (lang.length >= 2 && lang[1].length === 2) return lang[1].toUpperCase();
  return LANG_TO_COUNTRY[lang[0]] || "";
}

export function useGeoSuggestions(): GeoResult {
  const [suggestions, setSuggestions] = useState<GeoSuggestion[]>(FALLBACK);
  const [locationLabel, setLocationLabel] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [countryCode, setCountryCode] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    (async () => {
      let geo: GeoData | null = null;

      // Try sessionStorage cache first for instant load
      try {
        const cached = sessionStorage.getItem("geo_cache");
        if (cached) {
          geo = JSON.parse(cached) as GeoData;
        }
      } catch {}

      if (!geo || !geo.countryCode) {
        for (const provider of PROVIDERS) {
          geo = await tryProvider(provider.url, provider.normalize, controller.signal);
          if (geo && geo.countryCode) break;
        }
      }

      // Language-based fallback
      if (!geo || !geo.countryCode) {
        const cc = guessCountryFromLanguage();
        if (cc) {
          geo = { city: "", country: "", countryCode: cc, continent: "", state: "" };
        }
      }

      if (geo && geo.countryCode) {
        const cc = geo.countryCode.toUpperCase();
        setCountryCode(cc);

        // Cache for instant next load
        try {
          sessionStorage.setItem("geo_cache", JSON.stringify({ ...geo, countryCode: cc }));
        } catch {}

        // Resolve city alias for obscure locations
        const resolvedCity = geo.city && CITY_ALIASES[geo.city] ? CITY_ALIASES[geo.city] : geo.city;

        // Prioritize state-level prompts (India), then country, then region
        const stateKey = (geo.state || "").trim();
        let selectedPrompts: GeoSuggestion[] | null = null;

        if (stateKey && STATE_PROMPTS[stateKey]) {
          selectedPrompts = STATE_PROMPTS[stateKey];
        } else if (COUNTRY_PROMPTS[cc]) {
          selectedPrompts = COUNTRY_PROMPTS[cc];
        }

        if (selectedPrompts) {
          const prompts = selectedPrompts.map((p) => ({
            ...p,
            text: resolvedCity ? p.text.replace("{city}", resolvedCity) : p.text.replace(/from \{city\} /g, ""),
          }));
          setSuggestions(prompts);
        } else if (geo.continent && REGION_PROMPTS[geo.continent]) {
          setSuggestions(REGION_PROMPTS[geo.continent]);
        }

        if (resolvedCity) {
          setLocationLabel(`Popular trips near ${resolvedCity}`);
        } else if (geo.state) {
          setLocationLabel(`Suggested trips in ${geo.state}`);
        } else if (geo.country) {
          setLocationLabel(`Suggested for travelers in ${geo.country}`);
        }
      }

      clearTimeout(timeout);
      setIsLoading(false);
    })();

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, []);

  return { suggestions, locationLabel, isLoading, countryCode };
}
