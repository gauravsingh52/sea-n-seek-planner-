import { Ship, Hotel, Bus, MapPin, Train, Car, Plane, GripVertical, Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingLinks } from "@/components/BookingLinks";
import type { ItineraryLeg, WeatherData } from "@/types/itinerary";

const iconMap: Record<string, any> = { ship: Ship, train: Train, car: Car, plane: Plane, bus: Bus, hotel: Hotel, pin: MapPin };

function getIcon(leg: ItineraryLeg) {
  if (leg.icon && iconMap[leg.icon]) return iconMap[leg.icon];
  if (leg.type === "transport") return Ship;
  if (leg.type === "hotel") return Hotel;
  return MapPin;
}

const legColors: Record<string, string> = { transport: "border-l-primary", hotel: "border-l-accent", activity: "border-l-secondary" };
const legIconBg: Record<string, string> = { transport: "bg-primary/15 text-primary", hotel: "bg-accent/15 text-accent", activity: "bg-secondary/15 text-secondary-foreground" };

function WeatherBadge({ data }: { data: WeatherData }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground" title={data.condition}>
      {data.icon} {data.tempHigh}°/{data.tempLow}°C
    </span>
  );
}

interface LegCardProps {
  leg: ItineraryLeg;
  symbol: string;
  weather: Record<string, WeatherData>;
  isLast: boolean;
  index: number;
  onDelete?: (id: string) => void;
}

export function LegCard({ leg, symbol, weather, isLast, index, onDelete }: LegCardProps) {
  const Icon = getIcon(leg);
  const borderColor = legColors[leg.type] || "border-l-primary";
  const iconBg = legIconBg[leg.type] || "bg-primary/15 text-primary";
  const legWeather = leg.to ? weather[leg.to] : undefined;

  return (
    <div className="relative mb-4">
      {!isLast && (
        <div className="absolute left-[23px] top-[56px] bottom-[-16px] w-[2px] bg-gradient-to-b from-primary/40 to-primary/10" />
      )}
      <Card
        className={`glass gradient-border border-l-[3px] ${borderColor} animate-slide-up-fade hover:scale-[1.02] transition-transform duration-300`}
        style={{ animationDelay: `${index * 0.1}s` }}
      >
        <CardHeader className="flex flex-row items-center gap-3 py-3 px-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-sans font-semibold text-foreground">{leg.title}</CardTitle>
            <p className="text-xs text-muted-foreground truncate">{leg.description}</p>
            {leg.from && leg.to && <p className="text-xs text-muted-foreground/70 mt-0.5">{leg.from} → {leg.to}</p>}
            {legWeather && <div className="mt-1"><WeatherBadge data={legWeather} /></div>}
          </div>
          <div className="text-right flex-shrink-0 flex items-center gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">{leg.cost > 0 ? `${symbol}${leg.cost}` : "Free"}</p>
              {leg.time && <p className="text-xs text-muted-foreground">{leg.time}</p>}
              <BookingLinks leg={leg} />
            </div>
            {onDelete && (
              <button
                onClick={() => onDelete(leg.id)}
                className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                title="Remove stop"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}

export function SortableLegCard({ leg, symbol, weather, isLast, index, onDelete }: LegCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: leg.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const Icon = getIcon(leg);
  const borderColor = legColors[leg.type] || "border-l-primary";
  const iconBg = legIconBg[leg.type] || "bg-primary/15 text-primary";
  const legWeather = leg.to ? weather[leg.to] : undefined;

  return (
    <div ref={setNodeRef} style={style} className="relative mb-4">
      {!isLast && (
        <div className="absolute left-[23px] top-[56px] bottom-[-16px] w-[2px] bg-gradient-to-b from-primary/40 to-primary/10" />
      )}
      <Card
        className={`glass gradient-border border-l-[3px] ${borderColor} animate-slide-up-fade hover:scale-[1.02] transition-transform duration-300`}
        style={{ animationDelay: `${index * 0.1}s` }}
      >
        <CardHeader className="flex flex-row items-center gap-3 py-3 px-4">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors touch-none flex-shrink-0 opacity-50 hover:opacity-100"
            aria-label="Drag to reorder"
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-sans font-semibold text-foreground">{leg.title}</CardTitle>
            <p className="text-xs text-muted-foreground truncate">{leg.description}</p>
            {leg.from && leg.to && <p className="text-xs text-muted-foreground/70 mt-0.5">{leg.from} → {leg.to}</p>}
            {legWeather && <div className="mt-1"><WeatherBadge data={legWeather} /></div>}
          </div>
          <div className="text-right flex-shrink-0 flex items-center gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">{leg.cost > 0 ? `${symbol}${leg.cost}` : "Free"}</p>
              {leg.time && <p className="text-xs text-muted-foreground">{leg.time}</p>}
              <BookingLinks leg={leg} />
            </div>
            {onDelete && (
              <button
                onClick={() => onDelete(leg.id)}
                className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                title="Remove stop"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
