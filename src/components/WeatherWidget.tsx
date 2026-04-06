import { Droplets, CloudRain, Sun, Cloud, CloudSnow, CloudLightning, CloudSun, CloudFog, Thermometer } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { WeatherData } from "@/types/itinerary";

function AnimatedWeatherIcon({ condition, size = "lg" }: { condition: string; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "w-8 h-8" : "w-4 h-4";
  const c = condition.toLowerCase();

  if (c.includes("thunder") || c.includes("lightning")) {
    return <CloudLightning className={`${cls} text-indigo-400 animate-weather-lightning`} />;
  }
  if (c.includes("snow")) {
    return <CloudSnow className={`${cls} text-sky-300 animate-weather-snow`} />;
  }
  if (c.includes("heavy rain")) {
    return <CloudRain className={`${cls} text-blue-500 animate-weather-rain`} />;
  }
  if (c.includes("rain") || c.includes("drizzle")) {
    return <CloudRain className={`${cls} text-blue-400 animate-weather-rain`} />;
  }
  if (c.includes("fog") || c.includes("mist") || c.includes("haze")) {
    return <CloudFog className={`${cls} text-muted-foreground animate-weather-drift`} />;
  }
  if (c.includes("overcast")) {
    return <Cloud className={`${cls} text-muted-foreground animate-weather-drift`} />;
  }
  if (c.includes("partly") || c.includes("mainly clear")) {
    return <CloudSun className={`${cls} text-amber-400 animate-weather-sun`} />;
  }
  if (c.includes("clear") || c.includes("sunny")) {
    return <Sun className={`${cls} text-amber-400 animate-weather-sun`} />;
  }
  return <Thermometer className={`${cls} text-muted-foreground`} />;
}

const conditionGradients: Record<string, string> = {
  "Clear sky": "from-amber-500/15 to-yellow-500/10",
  "Mainly clear": "from-amber-500/10 to-yellow-400/10",
  "Partly cloudy": "from-sky-400/10 to-slate-400/10",
  "Overcast": "from-slate-400/15 to-slate-500/10",
  "Rain": "from-blue-500/15 to-indigo-500/10",
  "Light rain": "from-blue-400/10 to-sky-400/10",
  "Heavy rain": "from-blue-600/15 to-indigo-600/10",
  "Thunderstorm": "from-indigo-600/15 to-purple-600/10",
  "Snow": "from-sky-200/20 to-blue-200/10",
  "Foggy": "from-slate-300/15 to-gray-400/10",
};

function getGradient(condition: string): string {
  for (const [key, value] of Object.entries(conditionGradients)) {
    if (condition.toLowerCase().includes(key.toLowerCase())) return value;
  }
  return "from-muted/20 to-muted/10";
}

function formatDay(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tmrw";
  return date.toLocaleDateString("en", { weekday: "short" });
}

interface WeatherWidgetProps {
  weather: Record<string, WeatherData>;
}

export function WeatherWidget({ weather }: WeatherWidgetProps) {
  const entries = Object.entries(weather);
  if (entries.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <CloudSun className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-display font-semibold gradient-text">Weather Forecast</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {entries.map(([name, data]) => (
          <Card key={name} className={`glass-strong gradient-border overflow-hidden bg-gradient-to-br ${getGradient(data.condition)}`}>
            <CardHeader className="py-3 px-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-sans font-semibold text-foreground">{name}</h4>
                  <p className="text-xs text-muted-foreground">{data.condition}</p>
                </div>
                <AnimatedWeatherIcon condition={data.condition} size="lg" />
              </div>

              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-foreground">{data.tempHigh}°</span>
                <span className="text-sm text-muted-foreground">{data.tempLow}°C</span>
                {data.humidity != null && (
                  <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                    <Droplets className="w-3 h-3" /> {data.humidity}%
                  </span>
                )}
                {data.precipChance != null && data.precipChance > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                    <CloudRain className="w-3 h-3" /> {data.precipChance}%
                  </span>
                )}
              </div>

              {data.forecast && data.forecast.length > 1 && (
                <div className="flex gap-2 pt-1 border-t border-border/20">
                  {data.forecast.map((day) => (
                    <div key={day.date} className="flex-1 text-center">
                      <p className="text-[10px] text-muted-foreground font-medium">{formatDay(day.date)}</p>
                      <div className="flex justify-center my-0.5">
                        <AnimatedWeatherIcon condition={day.condition} size="sm" />
                      </div>
                      <p className="text-[10px] text-foreground font-medium">{day.tempHigh}°/{day.tempLow}°</p>
                    </div>
                  ))}
                </div>
              )}
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
