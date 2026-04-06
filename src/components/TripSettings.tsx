import { useState } from "react";
import { Settings, Users, Wallet, CalendarIcon, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

export interface TripSettingsData {
  budget?: number;
  travelers: number;
  dateRange?: { from: Date; to: Date };
  language: string;
}

interface TripSettingsProps {
  settings: TripSettingsData;
  onChange: (settings: TripSettingsData) => void;
}

export function TripSettings({ settings, onChange }: TripSettingsProps) {
  const [expanded, setExpanded] = useState(false);

  const dateRange: DateRange | undefined = settings.dateRange
    ? { from: settings.dateRange.from, to: settings.dateRange.to }
    : undefined;

  return (
    <div className="w-full">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
      >
        <Settings className="w-3.5 h-3.5" />
        <span>Trip Settings</span>
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {(settings.budget || settings.travelers > 1 || settings.dateRange) && (
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
        )}
      </button>

      {expanded && (
        <div className="flex flex-wrap items-center gap-2 mt-2 px-2 animate-slide-up-fade">
          {/* Budget */}
          <div className="flex items-center gap-1.5 glass rounded-xl px-3 py-1.5">
            <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
            <Input
              type="number"
              placeholder="Budget"
              value={settings.budget || ""}
              onChange={(e) => onChange({ ...settings, budget: e.target.value ? Number(e.target.value) : undefined })}
              className="w-20 h-6 text-xs border-0 bg-transparent p-0 focus-visible:ring-0"
            />
          </div>

          {/* Travelers */}
          <div className="flex items-center gap-1.5 glass rounded-xl px-3 py-1.5">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={settings.travelers}
              onChange={(e) => onChange({ ...settings, travelers: Number(e.target.value) })}
              className="h-6 text-xs bg-transparent border-0 text-foreground focus:outline-none"
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n} {n === 1 ? "traveler" : "travelers"}</option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1.5 glass rounded-xl px-3 py-1.5 text-xs">
                <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
                <span className={cn(!settings.dateRange && "text-muted-foreground")}>
                  {settings.dateRange
                    ? `${format(settings.dateRange.from, "MMM d")} – ${format(settings.dateRange.to, "MMM d")}`
                    : "Dates"}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    onChange({ ...settings, dateRange: { from: range.from, to: range.to } });
                  } else if (!range) {
                    onChange({ ...settings, dateRange: undefined });
                  }
                }}
                numberOfMonths={1}
                className={cn("p-3 pointer-events-auto")}
                disabled={(date) => date < new Date()}
              />
            </PopoverContent>
          </Popover>

          {/* Clear */}
          {(settings.budget || settings.travelers > 1 || settings.dateRange) && (
            <button
              onClick={() => onChange({ budget: undefined, travelers: 1, dateRange: undefined, language: settings.language })}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
