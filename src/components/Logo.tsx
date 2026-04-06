export function Logo({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <div
      className={`inline-flex items-center justify-center transition-transform duration-400 hover:rotate-6 hover:scale-110 group animate-[logo-entrance_0.8s_cubic-bezier(0.34,1.56,0.64,1)_forwards] ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logo-ring" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
          <linearGradient id="logo-plane" x1="18" y1="16" x2="46" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
          <radialGradient id="logo-glow" cx="32" cy="32" r="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="hsl(var(--sunset) / 0.3)" />
            <stop offset="100%" stopColor="hsl(var(--sunset) / 0)" />
          </radialGradient>
          <filter id="logo-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="hsl(var(--primary))" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Bold gradient ring with gap */}
        <circle
          cx="32"
          cy="32"
          r="28"
          stroke="url(#logo-ring)"
          strokeWidth="4"
          strokeDasharray="160 16"
          strokeLinecap="round"
          fill="none"
        />

        {/* Warm glow behind the plane */}
        <circle cx="32" cy="30" r="18" fill="url(#logo-glow)" />

        {/* Large paper plane */}
        <g filter="url(#logo-shadow)" className="logo-plane-inner">
          <path
            d="M 18 38 L 32 14 L 46 38 L 32 32 Z"
            fill="url(#logo-plane)"
          />
          {/* Fold line for 3D effect */}
          <path
            d="M 32 14 L 32 32"
            stroke="hsl(var(--primary-foreground) / 0.3)"
            strokeWidth="1.5"
          />
        </g>

        {/* Motion trail dots */}
        <circle cx="18" cy="46" r="2.5" fill="hsl(var(--accent) / 0.5)" />
        <circle cx="13" cy="50" r="1.8" fill="hsl(var(--accent) / 0.3)" />
        <circle cx="9" cy="53" r="1.2" fill="hsl(var(--accent) / 0.15)" />
      </svg>
    </div>
  );
}
