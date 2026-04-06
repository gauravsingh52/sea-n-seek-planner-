import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ItineraryData } from "@/types/itinerary";

interface PresenceUser {
  id: string;
  name: string;
  color: string;
  online_at: string;
}

const COLORS = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];
const NAMES = ["Traveler", "Explorer", "Wanderer", "Adventurer", "Voyager", "Nomad", "Pilgrim", "Pathfinder"];

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function useCollaborativeTrip(shareCode: string | undefined) {
  const [itinerary, setItinerary] = useState<ItineraryData | null>(null);
  const [title, setTitle] = useState("");
  const [tripId, setTripId] = useState("");
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const myIdRef = useRef(`user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial fetch
  useEffect(() => {
    if (!shareCode) {
      console.warn("useCollaborativeTrip: No shareCode provided");
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      setError(null);
      
      // Decode shareCode in case it's URL-encoded
      const decodedShareCode = decodeURIComponent(shareCode);
      console.log("Fetching shared trip with share_code:", { original: shareCode, decoded: decodedShareCode });
      
      const { data, error } = await supabase
        .from("shared_trips")
        .select("*")
        .eq("share_code", decodedShareCode)
        .maybeSingle();

      console.log("Trip fetch result:", { data, error, shareCode: decodedShareCode });

      if (error) {
        const errorMsg = `Error fetching shared trip: ${error.message}`;
        console.error(errorMsg);
        setError(errorMsg);
        setLoading(false);
        return;
      }

      if (!data) {
        const notFoundMsg = `No trip found for share_code: ${decodedShareCode}. The link may be invalid or the trip may have been deleted.`;
        console.warn(notFoundMsg);
        setError(notFoundMsg);
        setLoading(false);
        return;
      }

      try {
        setItinerary(data.itinerary_data as unknown as ItineraryData);
        setTitle(data.title || "Shared Trip");
        setTripId(data.id);
        setError(null);
        console.log("Trip loaded successfully:", { title: data.title, tripId: data.id, legsCount: (data.itinerary_data as any)?.legs?.length || 0 });
      } catch (parseErr) {
        const parseErrorMsg = `Error parsing trip data: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`;
        console.error(parseErrorMsg);
        setError(parseErrorMsg);
      }
      
      setLoading(false);
    })();
  }, [shareCode]);

  // Realtime subscription + presence
  useEffect(() => {
    if (!shareCode || !tripId) return;

    const myUser: PresenceUser = {
      id: myIdRef.current,
      name: randomPick(NAMES),
      color: randomPick(COLORS),
      online_at: new Date().toISOString(),
    };

    const channel = supabase
      .channel(`collab:${shareCode}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "shared_trips",
          filter: `share_code=eq.${shareCode}`,
        },
        (payload) => {
          const newData = payload.new as any;
          if (newData?.itinerary_data) {
            setItinerary(newData.itinerary_data as unknown as ItineraryData);
          }
          if (newData?.title) {
            setTitle(newData.title);
          }
        }
      )
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users: PresenceUser[] = [];
        Object.values(state).forEach((presences: any[]) => {
          presences.forEach((p) => {
            if (p.id !== myUser.id) {
              users.push(p as PresenceUser);
            }
          });
        });
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track(myUser);
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [shareCode, tripId]);

  // Debounced write to DB
  const updateItinerary = useCallback(
    (newItinerary: ItineraryData) => {
      if (!tripId) return;
      // Optimistic local update
      setItinerary(newItinerary);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        await supabase
          .from("shared_trips")
          .update({ itinerary_data: newItinerary as any })
          .eq("id", tripId);
      }, 300);
    },
    [tripId]
  );

  return {
    itinerary,
    title,
    tripId,
    loading,
    onlineUsers,
    updateItinerary,
    myId: myIdRef.current,
    error,
  };
}
