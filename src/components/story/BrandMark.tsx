/** The QuantumDataLytica mark: scattered points gathered around one core. Matches the favicon. */
export function BrandMark({ className = "" }: { className?: string }) {
  const points = Array.from({ length: 8 }, (_, index) => {
    const angle = (index / 8) * Math.PI * 2 - Math.PI / 2;
    return [32 + Math.cos(angle) * 19, 32 + Math.sin(angle) * 19] as const;
  });
  return (
    <svg
      className={`brand-mark ${className}`}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      <g className="brand-mark-ring">
        {points.map(([x, y], index) => (
          <circle key={index} cx={x.toFixed(2)} cy={y.toFixed(2)} r="3.4" fill="currentColor" />
        ))}
      </g>
      <circle className="brand-mark-core" cx="32" cy="32" r="8.5" fill="var(--accent)" />
    </svg>
  );
}
