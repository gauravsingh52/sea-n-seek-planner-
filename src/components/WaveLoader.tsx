import { Globe } from "lucide-react";

export function WaveLoader() {
  return (
    <div className="flex gap-3" style={{ animation: "slide-in-left 0.4s ease-out forwards" }}>
      <div className="flex-shrink-0 w-9 h-9 rounded-full earth-gradient flex items-center justify-center shadow-md animate-pulse-glow">
        <Globe className="w-4 h-4 text-primary-foreground animate-spin-slow" />
      </div>
      <div className="glass-strong rounded-2xl rounded-bl-md px-5 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full earth-gradient animate-pulse-dot shadow-sm"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}
