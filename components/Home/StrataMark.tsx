const BANDS = [
  { y: 0, height: 36, drift: -0.09 },
  { y: 41, height: 25, drift: -0.03 },
  { y: 71, height: 14, drift: 0.03 },
  { y: 90, height: 10, drift: 0.09 },
];

export function StrataMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 -20 100 140" role="img" aria-label="DataMap" className={`overflow-visible ${className}`}>
      <defs>
        <clipPath id="strata-mark-clip">
          <path d="M10 0 H40 A50 50 0 0 1 40 100 H10 Z" />
        </clipPath>
      </defs>
      {BANDS.map((band, index) => (
        <g
          key={band.y}
          className="motion-safe:will-change-transform"
          style={{ transform: `translateY(calc(var(--hero-scroll, 0) * ${band.drift}px))` }}
        >
          <g
            className="motion-safe:animate-strata-in"
            style={{ animationDelay: `${120 + index * 110}ms` }}
          >
            <rect
              x="0"
              y={band.y}
              width="100"
              height={band.height}
              fill="#0b0b0c"
              clipPath="url(#strata-mark-clip)"
            />
          </g>
        </g>
      ))}
    </svg>
  );
}
