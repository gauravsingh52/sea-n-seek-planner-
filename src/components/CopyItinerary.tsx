import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ItineraryData } from "@/types/itinerary";
import { toast } from "sonner";

const currencySymbols: Record<string, string> = { INR: "₹", EUR: "€", USD: "$", GBP: "£", JPY: "¥", THB: "฿", AUD: "A$", CAD: "C$", SGD: "S$", MYR: "RM", NZD: "NZ$" };

export function CopyItinerary({ itinerary }: { itinerary: ItineraryData }) {
  const handleCopy = () => {
    const symbol = currencySymbols[itinerary.currency] || itinerary.currency || "$";
    const dayGroups: Record<number, typeof itinerary.legs> = {};
    itinerary.legs.forEach((leg) => {
      const day = leg.day || 1;
      if (!dayGroups[day]) dayGroups[day] = [];
      dayGroups[day].push(leg);
    });

    let text = `✈️ ${itinerary.title || "Trip Itinerary"}\n`;
    if (itinerary.days) text += `📅 ${itinerary.days} day${itinerary.days > 1 ? "s" : ""}${itinerary.nights ? `, ${itinerary.nights} night${itinerary.nights > 1 ? "s" : ""}` : ""}\n`;
    text += "\n";

    for (const [day, legs] of Object.entries(dayGroups).sort(([a], [b]) => Number(a) - Number(b))) {
      text += `📌 Day ${day}\n`;
      for (const leg of legs) {
        const cost = leg.cost > 0 ? ` — ${symbol}${leg.cost}` : "";
        text += `  • ${leg.title}${cost}\n`;
        if (leg.description) text += `    ${leg.description}\n`;
        if (leg.from && leg.to) text += `    ${leg.from} → ${leg.to}\n`;
        if (leg.time) text += `    🕐 ${leg.time}\n`;
      }
      text += "\n";
    }

    text += `💰 Total: ${symbol}${itinerary.totalCost}\n`;

    if (itinerary.packingList?.length) {
      text += `\n🎒 Packing: ${itinerary.packingList.join(", ")}`;
    }

    navigator.clipboard.writeText(text).then(
      () => toast.success("Itinerary copied to clipboard!"),
      () => toast.error("Failed to copy")
    );
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleCopy} title="Copy as text" className="glass text-foreground">
      <Copy className="w-4 h-4" />
    </Button>
  );
}
