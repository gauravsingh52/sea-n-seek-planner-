import { Clock, MapPin, DollarSign, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ItineraryData } from "@/types/itinerary";

const currencySymbols: Record<string, string> = {
  INR: "₹", EUR: "€", USD: "$", GBP: "£", JPY: "¥", THB: "฿", AUD: "A$",
  CAD: "C$", SGD: "S$", MYR: "RM", NZD: "NZ$",
};

interface TripComparisonProps {
  itineraries: ItineraryData[];
  onSelect: (itinerary: ItineraryData) => void;
}

export function TripComparison({ itineraries, onSelect }: TripComparisonProps) {
  if (itineraries.length < 2) return null;

  const cheapest = itineraries.reduce((a, b) => a.totalCost < b.totalCost ? a : b);
  const shortest = itineraries.reduce((a, b) => (a.days || 99) < (b.days || 99) ? a : b);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-display font-bold gradient-text text-center">Compare Options</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {itineraries.map((it, i) => {
          const symbol = currencySymbols[it.currency] || it.currency || "$";
          const isCheapest = it === cheapest;
          const isShortest = it === shortest && itineraries.length > 2;
          const transportLegs = it.legs.filter(l => l.type === "transport");
          const hotelLegs = it.legs.filter(l => l.type === "hotel");
          const activityLegs = it.legs.filter(l => l.type === "activity");

          return (
            <Card key={i} className="glass-strong gradient-border relative overflow-hidden hover:scale-[1.02] transition-transform duration-300">
              {(isCheapest || isShortest) && (
                <div className="absolute top-3 right-3 flex gap-1">
                  {isCheapest && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">
                      Best Value
                    </span>
                  )}
                  {isShortest && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground font-semibold">
                      Fastest
                    </span>
                  )}
                </div>
              )}
              <CardHeader className="space-y-4">
                <CardTitle className="text-base font-display text-foreground pr-20">
                  {it.title || `Option ${String.fromCharCode(65 + i)}`}
                </CardTitle>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-primary" />
                    <div>
                      <p className="font-semibold text-foreground">{symbol}{it.totalCost.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">Total cost</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-primary" />
                    <div>
                      <p className="font-semibold text-foreground">{it.days || "—"} days</p>
                      <p className="text-[10px] text-muted-foreground">{it.nights || "—"} nights</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <p>🚆 {transportLegs.length} transport leg{transportLegs.length !== 1 ? "s" : ""}</p>
                  <p>🏨 {hotelLegs.length} hotel{hotelLegs.length !== 1 ? "s" : ""}</p>
                  <p>📍 {activityLegs.length} activit{activityLegs.length !== 1 ? "ies" : "y"}</p>
                </div>

                {/* Key stops */}
                <div className="flex flex-wrap gap-1">
                  {[...new Set(it.legs.map(l => l.from).filter(Boolean))].slice(0, 4).map((place) => (
                    <span key={place} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5" /> {place}
                    </span>
                  ))}
                </div>

                <Button
                  onClick={() => onSelect(it)}
                  className="w-full rounded-xl earth-gradient text-sm"
                  size="sm"
                >
                  View Full Itinerary <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
