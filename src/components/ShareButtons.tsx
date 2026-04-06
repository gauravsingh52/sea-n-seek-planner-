import { useState } from "react";
import { Share2, MessageCircle, Send, Link2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import type { ItineraryData } from "@/types/itinerary";
import { toast } from "sonner";

const currencySymbols: Record<string, string> = {
  INR: "₹", EUR: "€", USD: "$", GBP: "£", JPY: "¥", THB: "฿", AUD: "A$",
};

function formatItineraryText(it: ItineraryData): string {
  const sym = currencySymbols[it.currency] || it.currency || "$";
  let text = `🗺️ ${it.title || "Trip Itinerary"}\n\n`;
  it.legs.forEach((leg, i) => {
    text += `${i + 1}. ${leg.title}\n`;
    text += `   ${leg.description}\n`;
    if (leg.from && leg.to) text += `   📍 ${leg.from} → ${leg.to}\n`;
    if (leg.time) text += `   🕐 ${leg.time}\n`;
    if (leg.cost > 0) text += `   💰 ${sym}${leg.cost}\n`;
    text += "\n";
  });
  text += `━━━━━━━━━━━━━━━\n💰 Total: ${sym}${it.totalCost}\n\nPlanned with TripMap Planner ✈️`;
  return text;
}

async function createShareLink(itinerary: ItineraryData): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke("share-trip", {
      body: { itinerary, title: itinerary.title },
    });

    console.log("share-trip response:", { data, error });

    if (error) {
      throw new Error(`Server error: ${error.message || JSON.stringify(error)}`);
    }

    if (!data) {
      throw new Error("No data returned from server");
    }

    // Extract share code - handle various response formats
    const shareCode = data?.shareCode || data?.share_code;
    
    if (!shareCode || typeof shareCode !== 'string') {
      console.error("Invalid share code:", { data, shareCode });
      throw new Error("Invalid share code returned from server");
    }

    // Verify the trip was actually saved to avoid "Trip not found" on fresh link
    let verified = false;
    for (let i = 0; i < 3; i++) {
      const { data: verification } = await supabase
        .from("shared_trips")
        .select("id")
        .eq("share_code", shareCode)
        .maybeSingle();
      
      if (verification) {
        verified = true;
        console.log("Trip verified in database");
        break;
      }
      
      console.log(`Verification attempt ${i + 1}/3 - trip not found yet, retrying...`);
      // Wait 100ms before retry
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!verified) {
      console.warn("Trip could not be verified in database after 3 attempts");
    }

    // Construct the full URL
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/trip/${encodeURIComponent(shareCode)}`;
    
    console.log("Generated share link:", url);
    return url;
  } catch (err) {
    console.error("Share link creation failed:", err);
    throw err;
  }
}

function fallbackCopy(value: string): boolean {
  try {
    const ta = document.createElement("textarea");
    ta.value = value;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return true;
  } catch {
    return false;
  }
}

async function tryCopy(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return fallbackCopy(value);
  }
}

interface ShareButtonsProps {
  itinerary: ItineraryData;
  onCollaborate?: (shareUrl: string) => void;
}

export function ShareButtons({ itinerary, onCollaborate }: ShareButtonsProps) {
  const [sharing, setSharing] = useState(false);
  const [collaborating, setCollaborating] = useState(false);
  const text = formatItineraryText(itinerary);
  const encoded = encodeURIComponent(text);

  const shareWhatsApp = () => window.open(`https://wa.me/?text=${encoded}`, "_blank");
  const shareTelegram = () => window.open(`https://t.me/share/url?text=${encoded}`, "_blank");

  const copyLink = async () => {
    setSharing(true);
    try {
      const url = await createShareLink(itinerary);
      const copied = await tryCopy(url);
      if (copied) {
        toast.success("Share link copied!");
      } else {
        toast.success(`Share link ready`, {
          description: url,
          duration: 15000,
        });
      }
    } catch (err) {
      console.error("Share link failed:", err);
      const copied = await tryCopy(text);
      toast.info(copied ? "Itinerary text copied (link unavailable)" : "Could not copy — please try again");
    } finally {
      setSharing(false);
    }
  };

  const collaborate = async () => {
    setCollaborating(true);
    try {
      const url = await createShareLink(itinerary);
      const copied = await tryCopy(url);
      if (copied) {
        toast.success("Collaborate link copied! Share it with friends to plan together.");
      } else {
        toast.success("Collaborate link ready", {
          description: url,
          duration: 15000,
        });
      }
      if (onCollaborate) onCollaborate(url);
    } catch (err) {
      console.error("Collaborate link failed:", err);
      toast.error("Could not create collaboration link. Please try again.");
    } finally {
      setCollaborating(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" title="Share" className="glass text-foreground">
          <Share2 className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="end">
        <div className="space-y-1">
          <button onClick={shareWhatsApp} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors">
            <MessageCircle className="w-4 h-4 text-green-500" /> WhatsApp
          </button>
          <button onClick={shareTelegram} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors">
            <Send className="w-4 h-4 text-blue-500" /> Telegram
          </button>
          <button onClick={copyLink} disabled={sharing} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors disabled:opacity-50">
            <Link2 className="w-4 h-4 text-primary" /> {sharing ? "Creating link..." : "Copy Link"}
          </button>
          <div className="border-t border-border my-1" />
          <button onClick={collaborate} disabled={collaborating} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors disabled:opacity-50">
            <Users className="w-4 h-4 text-accent-foreground" /> {collaborating ? "Creating..." : "Collaborate"}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
