import { lazy, Suspense, Component, ReactNode, useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquare, Send, MapPin, Luggage, Users, Trash2 } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/Logo";
import { ItineraryCalendar } from "@/components/ItineraryCalendar";
import { DestinationPhotos } from "@/components/DestinationPhotos";
import { WeatherWidget } from "@/components/WeatherWidget";
import { TripDuration } from "@/components/TripDuration";
import { CustomStop } from "@/components/CustomStop";
import { SortableLegCard, LegCard } from "@/components/LegCard";
import { useWeather } from "@/hooks/useWeather";
import { useCollaborativeTrip } from "@/hooks/useCollaborativeTrip";
import { supabase } from "@/integrations/supabase/client";
import type { ItineraryData, ItineraryLeg } from "@/types/itinerary";
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

const currencySymbols: Record<string, string> = {
  INR: "₹", EUR: "€", USD: "$", GBP: "£", JPY: "¥", THB: "฿", AUD: "A$",
};

interface Comment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
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

function CostBreakdown({ legs, totalCost, currency }: { legs: ItineraryData["legs"]; totalCost: number; currency: string }) {
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

function PresenceBar({ users }: { users: { id: string; name: string; color: string }[] }) {
  if (users.length === 0) return null;
  return (
    <div className="flex items-center gap-2 px-1">
      <Users className="w-3.5 h-3.5 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">{users.length} online</span>
      <div className="flex -space-x-2">
        {users.slice(0, 5).map((u) => (
          <div
            key={u.id}
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-background"
            style={{ backgroundColor: u.color }}
            title={u.name}
          >
            {u.name[0]}
          </div>
        ))}
        {users.length > 5 && (
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-muted text-muted-foreground ring-2 ring-background">
            +{users.length - 5}
          </div>
        )}
      </div>
    </div>
  );
}

function CommentsSection({ tripId, initialComments }: { tripId: string; initialComments: Comment[] }) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function addComment() {
    if (!newComment.trim() || !tripId) return;
    setSubmitting(true);
    const { data, error } = await supabase
      .from("trip_comments")
      .insert({ shared_trip_id: tripId, author_name: authorName.trim() || "Anonymous", content: newComment.trim() })
      .select()
      .single();
    if (error) {
      toast.error("Failed to add comment");
    } else {
      setComments((prev) => [...prev, data as Comment]);
      setNewComment("");
      toast.success("Comment added!");
    }
    setSubmitting(false);
  }

  return (
    <Card className="glass-strong gradient-border">
      <CardHeader className="py-3 px-5">
        <CardTitle className="text-base font-display gradient-text flex items-center gap-1.5">
          <MessageSquare className="w-4 h-4" /> Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <div className="px-5 pb-4 space-y-3">
        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first!</p>
        )}
        {comments.map((comment) => (
          <div key={comment.id} className="p-3 rounded-xl bg-muted/30 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">{comment.author_name}</span>
              <span className="text-[10px] text-muted-foreground">
                {new Date(comment.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{comment.content}</p>
          </div>
        ))}
        <div className="space-y-2 pt-2 border-t border-border/30">
          <Input placeholder="Your name (optional)" value={authorName} onChange={(e) => setAuthorName(e.target.value)} className="h-8 text-sm glass border-border/30" />
          <div className="flex gap-2">
            <Input placeholder="Add a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addComment()} className="h-9 text-sm glass border-border/30" />
            <Button size="icon" onClick={addComment} disabled={!newComment.trim() || submitting} className="h-9 w-9 earth-gradient">
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function SharedTrip() {
  const { shareCode } = useParams<{ shareCode: string }>();
  const navigate = useNavigate();
  
  // Debug logging
  useEffect(() => {
    console.log("SharedTrip component mounted with shareCode:", shareCode);
  }, [shareCode]);
  
  const { itinerary, title, tripId, loading, onlineUsers, updateItinerary, error } = useCollaborativeTrip(shareCode);
  const { weather } = useWeather(itinerary);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  // Load comments once tripId is available
  useEffect(() => {
    if (tripId && !commentsLoaded) {
      console.log("Loading comments for tripId:", tripId);
      supabase
        .from("trip_comments")
        .select("*")
        .eq("shared_trip_id", tripId)
        .order("created_at", { ascending: true })
        .then(({ data, error }) => {
          if (error) {
            console.error("Error loading comments:", error);
          } else {
            console.log("Comments loaded:", data?.length || 0);
            setComments((data as Comment[]) || []);
          }
          setCommentsLoaded(true);
        });
    }
  }, [tripId, commentsLoaded]);

  // Remove the broken old comment loading code
  const [prevTripId, setPrevTripId] = (useState as any)("");
  if (tripId && tripId !== prevTripId && commentsLoaded) {
    setPrevTripId(tripId);
  }

  const symbol = itinerary ? (currencySymbols[itinerary.currency] || itinerary.currency || "$") : "$";
  const maxDay = itinerary?.days || Math.max(...(itinerary?.legs.map(l => l.day || 1) || [1]));

  const dayGroups: Record<number, typeof itinerary.legs> = {};
  if (itinerary) {
    itinerary.legs.forEach((leg) => {
      const day = leg.day || 1;
      if (!dayGroups[day]) dayGroups[day] = [];
      dayGroups[day].push(leg);
    });
  }
  const hasDays = itinerary && Object.keys(dayGroups).length > 1;

  const handleAddStop = (leg: ItineraryLeg) => {
    if (!itinerary) return;
    updateItinerary({
      ...itinerary,
      legs: [...itinerary.legs, leg],
      totalCost: itinerary.totalCost + leg.cost,
    });
    toast.success("Stop added — synced to all viewers!");
  };

  const handleDeleteStop = (legId: string) => {
    if (!itinerary) return;
    const leg = itinerary.legs.find(l => l.id === legId);
    updateItinerary({
      ...itinerary,
      legs: itinerary.legs.filter(l => l.id !== legId),
      totalCost: itinerary.totalCost - (leg?.cost || 0),
    });
    toast.success("Stop removed");
  };

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
      const newLegs = arrayMove(itinerary.legs, oldIndex, newIndex);
      updateItinerary({ ...itinerary, legs: newLegs });
      toast.success("Itinerary reordered");
    }
  };

  const activeLeg = activeDragId ? itinerary?.legs.find((l) => l.id === activeDragId) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center px-4">
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold text-foreground mb-2">Trip not found</h2>
          <p className="text-muted-foreground mb-2">{error || "This share link may be invalid or expired."}</p>
          {shareCode && <p className="text-xs text-muted-foreground mb-4 font-mono break-all">Share code: {shareCode}</p>}
          <Button onClick={() => navigate("/")} className="rounded-2xl earth-gradient">Plan Your Own Trip</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-4 md:px-6 py-3 glass-strong border-b border-border/30">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="glass text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Logo size={36} />
          <div>
            <h1 className="text-lg font-display font-bold gradient-text">{title}</h1>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">Collaborative itinerary • {itinerary.legs.length} stops</p>
              <PresenceBar users={onlineUsers} />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Map */}
        <div className="h-[35vh] min-h-[220px] rounded-2xl overflow-hidden">
          <MapErrorBoundary>
            <Suspense fallback={<div className="w-full h-full glass-strong flex items-center justify-center"><p className="text-muted-foreground text-sm animate-pulse">Loading map...</p></div>}>
              <TripMap itinerary={itinerary} />
            </Suspense>
          </MapErrorBoundary>
        </div>

        {/* Weather */}
        {Object.keys(weather).length > 0 && <WeatherWidget weather={weather} />}

        {/* Trip duration stats */}
        <TripDuration itinerary={itinerary} />

        {/* Destination photos */}
        <DestinationPhotos itinerary={itinerary} />

        {/* Drag-and-drop itinerary list */}
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
                    <SortableLegCard key={leg.id} leg={leg} symbol={symbol} weather={weather} isLast={i === legs.length - 1} index={i} onDelete={handleDeleteStop} />
                  ))}
                </div>
              ))
            ) : (
              itinerary.legs.map((leg, i) => (
                <SortableLegCard key={leg.id} leg={leg} symbol={symbol} weather={weather} isLast={i === itinerary.legs.length - 1} index={i} onDelete={handleDeleteStop} />
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

        {/* Add custom stop */}
        <CustomStop onAdd={handleAddStop} maxDay={maxDay} />

        {/* Calendar view */}
        <Card className="glass-strong gradient-border p-4 overflow-x-auto">
          <div className="min-w-[600px]">
            <ItineraryCalendar itinerary={itinerary} currencySymbol={symbol} />
          </div>
        </Card>

        {/* Cost breakdown */}
        <CostBreakdown legs={itinerary.legs} totalCost={itinerary.totalCost} currency={itinerary.currency} />

        {/* Packing list */}
        {itinerary.packingList && itinerary.packingList.length > 0 && (
          <PackingListCard items={itinerary.packingList} />
        )}

        {/* Total cost */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Total estimated cost</p>
          <p className="text-2xl font-bold gradient-text">{symbol}{itinerary.totalCost.toFixed(0)}</p>
        </div>

        {/* Comments */}
        {tripId && <CommentsSection tripId={tripId} initialComments={comments} />}
      </div>
    </div>
  );
}
