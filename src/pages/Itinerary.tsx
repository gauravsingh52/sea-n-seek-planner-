import { lazy, Suspense, Component, ReactNode, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Sun, Moon, Bookmark, BookmarkCheck, Clock, Luggage, List, CalendarDays } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { SortableLegCard, LegCard } from "@/components/LegCard";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/Logo";
import { ShareButtons } from "@/components/ShareButtons";
import { CurrencyConverter } from "@/components/CurrencyConverter";
import { ExportPDF } from "@/components/ExportPDF";
import { CopyItinerary } from "@/components/CopyItinerary";
import { TravelChecklist } from "@/components/TravelChecklist";
import { CustomStop } from "@/components/CustomStop";
import { BookingLinks } from "@/components/BookingLinks";
import { DestinationPhotos } from "@/components/DestinationPhotos";
import { WeatherWidget } from "@/components/WeatherWidget";
import { TripDuration } from "@/components/TripDuration";
import { EmergencyInfo } from "@/components/EmergencyInfo";
import { ItineraryCalendar } from "@/components/ItineraryCalendar";
import { BudgetTracker } from "@/components/BudgetTracker";
import { useTrip } from "@/contexts/TripContext";
import { useSavedTrips } from "@/hooks/useSavedTrips";
import { useWeather } from "@/hooks/useWeather";
import type { ItineraryLeg, WeatherData } from "@/types/itinerary";
import { useTheme } from "@/hooks/useTheme";
import { toast } from "sonner";

const TripMap = lazy(() => import("@/components/TripMap").then(m => ({ default: m.TripMap })));

class MapErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <div className="w-full h-full rounded-2xl glass-strong flex items-center justify-center"><p className="text-muted-foreground text-sm">Map could not be loaded</p></div>;
    return this.props.children;
  }
}

const currencySymbols: Record<string, string> = { INR: "₹", EUR: "€", USD: "$", GBP: "£", JPY: "¥", THB: "฿", AUD: "A$", CAD: "C$", SGD: "S$", MYR: "RM", NZD: "NZ$" };

function CostBreakdown({ legs, totalCost, currency }: { legs: ItineraryLeg[]; totalCost: number; currency: string }) {
  const categories: Record<string, number> = {};
  legs.forEach((leg) => {
    const cat = leg.type === "transport" ? "Transport" : leg.type === "hotel" ? "Accommodation" : "Activities";
    categories[cat] = (categories[cat] || 0) + leg.cost;
  });
  const symbol = currencySymbols[currency] || currency || "$";

  return (
    <Card className="glass-strong gradient-border">
      <CardHeader className="py-4 px-5">
        <CardTitle className="text-base font-display gradient-text mb-3">💰 Cost Breakdown</CardTitle>
        <div className="space-y-2">
          {Object.entries(categories).map(([cat, cost]) => (
            <div key={cat} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{cat}</span>
              <span className="font-semibold text-foreground">{symbol}{cost.toFixed(0)}</span>
            </div>
          ))}
          <div className="border-t border-border/30 pt-2 flex justify-between text-base font-bold">
            <span className="gradient-text">Total</span>
            <span className="gradient-text">{symbol}{totalCost.toFixed(0)}</span>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

function PackingListCard({ items }: { items: string[] }) {
  return (
    <Card className="glass-strong gradient-border">
      <CardHeader className="py-4 px-5">
        <CardTitle className="text-base font-display gradient-text mb-3 flex items-center gap-1.5">
          <Luggage className="w-4 h-4" /> Packing List
        </CardTitle>
        <div className="grid grid-cols-2 gap-1.5">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </CardHeader>
    </Card>
  );
}

export default function Itinerary() {
  const navigate = useNavigate();
  const { itinerary, addCustomLeg, reorderLegs } = useTrip();
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const { theme, toggleTheme } = useTheme();
  const { saveTrip, isSaved } = useSavedTrips();
  const { weather } = useWeather(itinerary);
  const saved = isSaved(itinerary);

  const handleSave = () => {
    if (itinerary && !saved) {
      saveTrip(itinerary);
      toast.success("Trip saved!");
    }
  };

  // Group legs by day
  const dayGroups: Record<number, ItineraryLeg[]> = {};
  if (itinerary) {
    itinerary.legs.forEach((leg) => {
      const day = leg.day || 1;
      if (!dayGroups[day]) dayGroups[day] = [];
      dayGroups[day].push(leg);
    });
  }
  const hasDays = itinerary && Object.keys(dayGroups).length > 1;
  const symbol = itinerary ? (currencySymbols[itinerary.currency] || itinerary.currency || "$") : "$";
  const maxDay = itinerary?.days || Math.max(...Object.keys(dayGroups).map(Number), 1);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id || !itinerary) return;
    const oldIndex = itinerary.legs.findIndex((l) => l.id === active.id);
    const newIndex = itinerary.legs.findIndex((l) => l.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      reorderLegs(oldIndex, newIndex);
      toast.success("Itinerary reordered");
    }
  };

  const activeLeg = activeDragId ? itinerary?.legs.find((l) => l.id === activeDragId) : null;

  // Build route chain for multi-city trips
  const routeChain = useMemo(() => {
    if (!itinerary) return "";
    const transportLegs = itinerary.legs.filter((l) => l.type === "transport" && l.from && l.to);
    if (transportLegs.length < 2) return "";
    const chain: string[] = [transportLegs[0].from!];
    transportLegs.forEach((l) => { if (l.to && chain[chain.length - 1] !== l.to) chain.push(l.to); });
    return chain.length >= 3 ? chain.join(" → ") : "";
  }, [itinerary]);

  return (
    <div className="min-h-screen bg-background relative travel-bg">
      <div className="particles">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="particle" style={{ left: `${Math.random() * 100}%`, animationDuration: `${15 + Math.random() * 20}s`, animationDelay: `${Math.random() * 10}s` }} />
        ))}
      </div>

      <header className="relative z-10 flex items-center justify-between px-4 md:px-6 py-3 glass-strong border-b border-border/30">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="glass text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Logo size={36} />
          <div>
            <h1 className="text-lg font-display font-bold gradient-text">
              {itinerary?.title || "Your Itinerary"}
            </h1>
            {itinerary?.days && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {itinerary.days} day{itinerary.days > 1 ? "s" : ""}{itinerary.nights ? `, ${itinerary.nights} night${itinerary.nights > 1 ? "s" : ""}` : ""}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {itinerary && (
            <>
              <ExportPDF itinerary={itinerary} />
              <CopyItinerary itinerary={itinerary} />
              <Button
                variant="ghost" size="icon" title={saved ? "Saved" : "Save trip"}
                className="glass text-foreground" onClick={handleSave} disabled={saved}
              >
                {saved ? <BookmarkCheck className="w-4 h-4 text-primary" /> : <Bookmark className="w-4 h-4" />}
              </Button>
              <ShareButtons itinerary={itinerary} onCollaborate={(url) => window.open(url, "_blank")} />
            </>
          )}
          {itinerary && (
            <div className="flex items-center glass rounded-lg p-0.5 mr-1">
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-7 w-7"
                onClick={() => setViewMode("list")}
                title="List view"
              >
                <List className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant={viewMode === "calendar" ? "secondary" : "ghost"}
                size="icon"
                className="h-7 w-7"
                onClick={() => setViewMode("calendar")}
                title="Calendar view"
              >
                <CalendarDays className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle theme" className="glass text-foreground">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
      </header>

      {!itinerary ? (
        <div className="max-w-3xl mx-auto px-4 py-8 relative z-10">
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-2xl glass-strong flex items-center justify-center mx-auto mb-6 animate-slide-up-fade">
              <MapPin className="w-10 h-10 text-muted-foreground animate-bounce-subtle" />
            </div>
            <h2 className="text-2xl font-display font-bold gradient-text mb-3 animate-slide-up-fade" style={{ animationDelay: "0.15s" }}>No itinerary yet</h2>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto animate-slide-up-fade" style={{ animationDelay: "0.3s" }}>
              Chat with TripMap Planner to create a travel plan. Your itinerary will appear here once generated.
            </p>
            <Button onClick={() => navigate("/")} className="rounded-2xl earth-gradient shadow-lg hover:scale-105 transition-transform duration-300 animate-slide-up-fade" style={{ animationDelay: "0.45s" }}>
              Start Planning
            </Button>
          </div>
        </div>
      ) : (
        <div className="relative z-10">
          <div className="h-[40vh] min-h-[250px] p-4 pb-2">
            <MapErrorBoundary>
              <Suspense fallback={
                <div className="w-full h-full rounded-2xl glass-strong flex items-center justify-center">
                  <p className="text-muted-foreground text-sm animate-pulse">Loading map...</p>
                </div>
              }>
                <TripMap itinerary={itinerary} />
              </Suspense>
            </MapErrorBoundary>
          </div>

          {Object.keys(weather).length > 0 && (
            <div className="px-4 pb-2">
              <div className="max-w-3xl mx-auto">
                <WeatherWidget weather={weather} />
              </div>
            </div>
          )}

          <div className="px-4 pb-6">
            <div className="max-w-3xl mx-auto space-y-4 pt-2">
              {/* Route chain for multi-city */}
              {routeChain && (
                <div className="text-center py-2">
                  <span className="text-sm font-display font-semibold gradient-text">{routeChain}</span>
                </div>
              )}

              {/* Trip duration stats */}
              <TripDuration itinerary={itinerary} />

              {/* Destination photos */}
              <DestinationPhotos itinerary={itinerary} />

              {viewMode === "calendar" ? (
                <ItineraryCalendar itinerary={itinerary} currencySymbol={symbol} />
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                  <SortableContext items={itinerary.legs.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                    {hasDays ? (
                      Object.entries(dayGroups).sort(([a], [b]) => Number(a) - Number(b)).map(([day, legs]) => (
                        <div key={day}>
                          <div className="flex items-center gap-2 mb-3 mt-4 first:mt-0">
                            <div className="w-8 h-8 rounded-full earth-gradient flex items-center justify-center text-primary-foreground text-xs font-bold">{day}</div>
                            <span className="text-sm font-display font-semibold text-foreground">Day {day}</span>
                            <div className="flex-1 h-px bg-border/30" />
                          </div>
                          {legs.map((leg, i) => (
                            <SortableLegCard key={leg.id} leg={leg} symbol={symbol} weather={weather} isLast={i === legs.length - 1} index={i} />
                          ))}
                        </div>
                      ))
                    ) : (
                      itinerary.legs.map((leg, i) => (
                        <SortableLegCard key={leg.id} leg={leg} symbol={symbol} weather={weather} isLast={i === itinerary.legs.length - 1} index={i} />
                      ))
                    )}
                  </SortableContext>
                  <DragOverlay>
                    {activeLeg ? (
                      <div className="opacity-90 scale-105">
                        <LegCard leg={activeLeg} symbol={symbol} weather={weather} isLast index={0} />
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              )}

              {/* Add custom stop */}
              <CustomStop onAdd={addCustomLeg} maxDay={maxDay} />

              {/* Emergency info */}
              <EmergencyInfo itinerary={itinerary} />

              {/* Packing list */}
              {itinerary.packingList && itinerary.packingList.length > 0 && (
                <PackingListCard items={itinerary.packingList} />
              )}

              {/* Travel checklist */}
              <TravelChecklist tripId={itinerary.title} />

              {/* Budget tracker */}
              <BudgetTracker itinerary={itinerary} />

              {/* Cost breakdown */}
              <CostBreakdown legs={itinerary.legs} totalCost={itinerary.totalCost} currency={itinerary.currency} />

              {/* Currency converter */}
              <CurrencyConverter baseCurrency={itinerary.currency} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// SortableLegCard and LegCard are now imported from @/components/LegCard
