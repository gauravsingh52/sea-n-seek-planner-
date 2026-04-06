import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, MapPin, Hotel, Navigation } from "lucide-react";
import type { ItineraryData } from "@/types/itinerary";

function parseHours(time?: string): number {
  if (!time) return 0;
  // Try to match "HH:MM – HH:MM" or "HH:MM - HH:MM"
  const match = time.match(/(\d{1,2}):(\d{2})\s*[–\-]\s*(\d{1,2}):(\d{2})/);
  if (!match) return 0;
  const startMin = parseInt(match[1]) * 60 + parseInt(match[2]);
  let endMin = parseInt(match[3]) * 60 + parseInt(match[4]);
  if (endMin < startMin) endMin += 24 * 60; // overnight
  return (endMin - startMin) / 60;
}

export function TripDuration({ itinerary }: { itinerary: ItineraryData }) {
  const transportLegs = itinerary.legs.filter((l) => l.type === "transport");
  const hotelLegs = itinerary.legs.filter((l) => l.type === "hotel");
  const activityLegs = itinerary.legs.filter((l) => l.type === "activity");

  const travelHours = transportLegs.reduce((sum, l) => sum + parseHours(l.time), 0);

  return (
    <Card className="glass-strong gradient-border">
      <CardHeader className="py-3 px-5">
        <CardTitle className="text-sm font-display gradient-text mb-3 flex items-center gap-1.5">
          <Clock className="w-4 h-4" /> Trip Summary
        </CardTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat icon={<Navigation className="w-4 h-4 text-primary" />} value={transportLegs.length} label="Transports" />
          <Stat icon={<Hotel className="w-4 h-4 text-accent" />} value={hotelLegs.length} label="Stays" />
          <Stat icon={<MapPin className="w-4 h-4 text-secondary-foreground" />} value={activityLegs.length} label="Activities" />
          <Stat icon={<Clock className="w-4 h-4 text-primary" />} value={`${travelHours.toFixed(1)}h`} label="Travel Time" />
        </div>
      </CardHeader>
    </Card>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div>
        <div className="text-sm font-bold text-foreground">{value}</div>
        <div className="text-[10px] text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
