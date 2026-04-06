import { ArrowRight } from "lucide-react";

interface TripTemplate {
  emoji: string;
  title: string;
  duration: string;
  budget: string;
  prompt: string;
}

const TEMPLATES: TripTemplate[] = [
  { emoji: "🗼", title: "Weekend in Paris", duration: "3 days", budget: "€500", prompt: "Plan a 3-day weekend trip to Paris, France with a budget of €500. Include must-see attractions, local restaurants, and transport options." },
  { emoji: "🎒", title: "Backpacking Southeast Asia", duration: "3 weeks", budget: "$1500", prompt: "Plan a 3-week backpacking trip through Thailand, Vietnam, and Cambodia with a budget of $1500. Include hostels, local transport, and must-do experiences." },
  { emoji: "🕌", title: "Golden Triangle India", duration: "7 days", budget: "₹25000", prompt: "Plan a 7-day Golden Triangle tour covering Delhi, Agra, and Jaipur with a budget of ₹25000. Include trains, hotels, and key attractions." },
  { emoji: "🚄", title: "Japan Rail Pass Tour", duration: "10 days", budget: "¥200000", prompt: "Plan a 10-day Japan trip using a JR Pass covering Tokyo, Kyoto, Osaka, and Hiroshima. Budget ¥200000. Include bullet trains, ryokans, and temples." },
  { emoji: "🏖️", title: "Bali Adventure", duration: "5 days", budget: "$800", prompt: "Plan a 5-day adventure trip to Bali, Indonesia with a budget of $800. Include surfing, temples, rice terraces, and local food." },
  { emoji: "🏔️", title: "Swiss Alps Explorer", duration: "5 days", budget: "CHF 1500", prompt: "Plan a 5-day Swiss Alps trip covering Interlaken, Zermatt, and Lucerne with a budget of CHF 1500. Include scenic trains, hiking, and mountain views." },
];

interface TripTemplatesProps {
  onSelect: (prompt: string) => void;
}

export function TripTemplates({ onSelect }: TripTemplatesProps) {
  return (
    <div className="w-full max-w-xl mt-8 animate-slide-up-fade" style={{ animationDelay: "0.6s" }}>
      <p className="text-sm text-muted-foreground mb-3 text-center">🗺️ Or start from a template</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {TEMPLATES.map((t) => (
          <button
            key={t.title}
            onClick={() => onSelect(t.prompt)}
            className="group relative text-left p-4 rounded-2xl glass gradient-border transition-all duration-300 hover:scale-[1.03] hover:shadow-lg hover:shadow-primary/10"
          >
            <div className="text-2xl mb-2">{t.emoji}</div>
            <p className="text-sm font-medium text-foreground leading-tight">{t.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{t.duration} · {t.budget}</p>
            <ArrowRight className="absolute right-3 bottom-3 w-3 h-3 text-primary opacity-0 transition-all duration-300 group-hover:opacity-100" />
          </button>
        ))}
      </div>
    </div>
  );
}
