import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, MapPin, Calendar, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { useTrip } from "@/contexts/TripContext";
import { useSavedTrips } from "@/hooks/useSavedTrips";
import { useTheme } from "@/hooks/useTheme";

const currencySymbols: Record<string, string> = {
  INR: "₹", EUR: "€", USD: "$", GBP: "£", JPY: "¥", THB: "฿", AUD: "A$", CAD: "C$", SGD: "S$", MYR: "RM", NZD: "NZ$",
};

export default function SavedTrips() {
  const navigate = useNavigate();
  const { setItinerary } = useTrip();
  const { trips, deleteTrip } = useSavedTrips();
  const { theme, toggleTheme } = useTheme();

  const loadTrip = (trip: typeof trips[0]) => {
    setItinerary(trip.itinerary);
    navigate("/itinerary");
  };

  return (
    <div className="min-h-screen bg-background relative travel-bg">
      <div className="particles">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="particle" style={{ left: `${Math.random() * 100}%`, animationDuration: `${15 + Math.random() * 20}s`, animationDelay: `${Math.random() * 10}s` }} />
        ))}
      </div>

      <header className="relative z-10 flex items-center justify-between px-4 md:px-6 py-3 glass-strong border-b border-border/30">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="glass text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Logo size={36} />
          <h1 className="text-lg font-display font-bold gradient-text">Saved Trips</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle theme" className="glass text-foreground">
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 relative z-10">
        {trips.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-2xl glass-strong flex items-center justify-center mx-auto mb-6 animate-slide-up-fade">
              <MapPin className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-display font-bold gradient-text mb-3 animate-slide-up-fade" style={{ animationDelay: "0.15s" }}>
              No saved trips yet
            </h2>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto animate-slide-up-fade" style={{ animationDelay: "0.3s" }}>
              Plan a trip and save it from the itinerary page to see it here.
            </p>
            <Button onClick={() => navigate("/")} className="rounded-2xl earth-gradient shadow-lg hover:scale-105 transition-transform duration-300 animate-slide-up-fade" style={{ animationDelay: "0.45s" }}>
              Start Planning
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {trips.map((trip, i) => {
              const sym = currencySymbols[trip.itinerary.currency] || trip.itinerary.currency || "$";
              const date = new Date(trip.savedAt);
              return (
                <Card
                  key={trip.id}
                  className="glass gradient-border cursor-pointer hover:scale-[1.02] transition-transform duration-300 animate-slide-up-fade"
                  style={{ animationDelay: `${i * 0.08}s` }}
                  onClick={() => loadTrip(trip)}
                >
                  <CardHeader className="flex flex-row items-center justify-between py-4 px-5">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-sans font-semibold text-foreground truncate">
                        {trip.itinerary.title || "Untitled Trip"}
                      </CardTitle>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {date.toLocaleDateString()}
                        </span>
                        <span>{trip.itinerary.legs.length} stops</span>
                        <span className="font-semibold text-foreground">
                          {sym}{trip.itinerary.totalCost.toFixed(0)}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="glass text-muted-foreground hover:text-destructive flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTrip(trip.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
