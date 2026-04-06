import { Sparkles } from "lucide-react";

interface FollowUpChipsProps {
  suggestions: string[];
  onSelect: (text: string) => void;
  disabled?: boolean;
  regionCode?: string;
}

const DEFAULT_FOLLOW_UPS = [
  "Compare 3 different options",
  "Show cheaper alternatives",
  "What should I pack?",
];

const REGION_FOLLOW_UPS: Record<string, string[]> = {
  IN: ["Best train routes nearby", "Local street food guide", "Monsoon travel tips"],
  US: ["National parks road trip", "Best airline deals", "Hidden gem small towns"],
  GB: ["Best countryside getaways", "London on a budget", "UK rail pass tips"],
  JP: ["Is JR Pass worth it?", "Best ramen spots nearby", "Cherry blossom season guide"],
  AU: ["Great Ocean Road tips", "Best snorkeling spots", "Outback survival guide"],
  TH: ["Island hopping itinerary", "Best Thai street food", "Temple etiquette tips"],
  DE: ["Best Christmas markets", "Castle road trip route", "Beer garden guide"],
  FR: ["Wine region tour", "Skip-the-line museum tips", "French Riviera on a budget"],
};

export function FollowUpChips({ suggestions, onSelect, disabled, regionCode }: FollowUpChipsProps) {
  const chips =
    suggestions.length > 0
      ? suggestions
      : (regionCode && REGION_FOLLOW_UPS[regionCode]) || DEFAULT_FOLLOW_UPS;

  return (
    <div className="flex flex-wrap gap-2 animate-slide-up-fade">
      <Sparkles className="w-3.5 h-3.5 text-primary mt-1.5" />
      {chips.map((text) => (
        <button
          key={text}
          onClick={() => onSelect(text)}
          disabled={disabled}
          className="text-xs px-3 py-1.5 rounded-full glass gradient-border text-foreground/80 hover:text-foreground hover:scale-105 transition-all duration-200 disabled:opacity-50"
        >
          {text}
        </button>
      ))}
    </div>
  );
}
