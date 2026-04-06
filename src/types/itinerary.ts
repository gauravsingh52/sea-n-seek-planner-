export type LegType = "transport" | "hotel" | "activity";

export interface ItineraryLeg {
  id: string;
  type: LegType;
  title: string;
  description: string;
  from?: string;
  to?: string;
  fromCoords?: { lat: number; lng: number };
  toCoords?: { lat: number; lng: number };
  time?: string;
  cost: number;
  icon?: string;
  day?: number;
}

export interface WeatherDayForecast {
  date: string;
  tempHigh: number;
  tempLow: number;
  condition: string;
  icon: string;
}

export interface WeatherData {
  tempHigh: number;
  tempLow: number;
  condition: string;
  icon: string;
  humidity?: number;
  precipChance?: number;
  forecast?: WeatherDayForecast[];
}

export interface EmergencyInfo {
  police: string;
  ambulance: string;
  fire?: string;
  tourist?: string;
}

export interface ItineraryData {
  legs: ItineraryLeg[];
  totalCost: number;
  currency: string;
  title?: string;
  days?: number;
  nights?: number;
  packingList?: string[];
  followUpSuggestions?: string[];
  emergencyInfo?: EmergencyInfo;
}
