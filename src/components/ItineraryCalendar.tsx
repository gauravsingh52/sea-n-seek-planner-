import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Ship, Hotel, Bus, MapPin, Train, Car, Plane } from "lucide-react";
import type { ItineraryData, ItineraryLeg } from "@/types/itinerary";

const iconMap: Record<string, any> = { ship: Ship, train: Train, car: Car, plane: Plane, bus: Bus, hotel: Hotel, pin: MapPin };
const typeColors: Record<string, string> = {
  transport: "bg-primary/15 border-primary/30 text-primary",
  hotel: "bg-accent/15 border-accent/30 text-accent",
  activity: "bg-secondary/15 border-secondary/30 text-secondary-foreground",
};
const typeDots: Record<string, string> = {
  transport: "bg-primary",
  hotel: "bg-accent",
  activity: "bg-secondary",
};

function getIcon(leg: ItineraryLeg) {
  if (leg.icon && iconMap[leg.icon]) return iconMap[leg.icon];
  if (leg.type === "transport") return Ship;
  if (leg.type === "hotel") return Hotel;
  return MapPin;
}

interface Props {
  itinerary: ItineraryData;
  currencySymbol: string;
}

export function ItineraryCalendar({ itinerary, currencySymbol }: Props) {
  const [expandedLeg, setExpandedLeg] = useState<string | null>(null);

  const dayGroups = useMemo(() => {
    const groups: Record<number, ItineraryLeg[]> = {};
    itinerary.legs.forEach((leg) => {
      const day = leg.day || 1;
      if (!groups[day]) groups[day] = [];
      groups[day].push(leg);
    });
    return Object.entries(groups).sort(([a], [b]) => Number(a) - Number(b));
  }, [itinerary.legs]);

  return (
    <div className="space-y-1">
      {/* Legend */}
      <div className="flex items-center gap-4 mb-3 px-1">
        {[
          { type: "transport", label: "Transport" },
          { type: "hotel", label: "Stay" },
          { type: "activity", label: "Activity" },
        ].map(({ type, label }) => (
          <div key={type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={`w-2.5 h-2.5 rounded-full ${typeDots[type]}`} />
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid gap-3" style={{ gridTemplateColumns: dayGroups.length <= 4 ? `repeat(${dayGroups.length}, 1fr)` : "repeat(auto-fill, minmax(220px, 1fr))" }}>
        {dayGroups.map(([day, legs]) => (
          <div key={day} className="space-y-2">
            {/* Day header */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full earth-gradient flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0">
                {day}
              </div>
              <span className="text-xs font-display font-semibold text-foreground">Day {day}</span>
            </div>

            {/* Time slots */}
            <div className="space-y-1.5 pl-2 border-l-2 border-border/30 ml-3.5">
              {legs.map((leg) => {
                const Icon = getIcon(leg);
                const colors = typeColors[leg.type] || typeColors.activity;
                const isExpanded = expandedLeg === leg.id;

                return (
                  <Card
                    key={leg.id}
                    className={`p-2.5 cursor-pointer border ${colors} transition-all duration-200 hover:scale-[1.02] ${isExpanded ? "ring-1 ring-primary/30" : ""}`}
                    onClick={() => setExpandedLeg(isExpanded ? null : leg.id)}
                  >
                    <div className="flex items-start gap-2">
                      <Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{leg.title}</p>
                        {leg.time && (
                          <p className="text-[10px] text-muted-foreground">{leg.time}</p>
                        )}
                        {isExpanded && (
                          <div className="mt-1.5 space-y-1 animate-slide-up-fade">
                            <p className="text-[11px] text-muted-foreground">{leg.description}</p>
                            {leg.from && leg.to && (
                              <p className="text-[10px] text-muted-foreground/70">{leg.from} → {leg.to}</p>
                            )}
                            <p className="text-[11px] font-semibold text-foreground">
                              {leg.cost > 0 ? `${currencySymbol}${leg.cost}` : "Free"}
                            </p>
                          </div>
                        )}
                      </div>
                      {!isExpanded && leg.cost > 0 && (
                        <span className="text-[10px] font-semibold text-foreground whitespace-nowrap">
                          {currencySymbol}{leg.cost}
                        </span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
