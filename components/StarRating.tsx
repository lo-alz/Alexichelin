/**
 * Renders a 0–5 rating as filled / half / empty rosettes — a bespoke six-petal
 * florette echoing the Michelin star mark — in muted gold over warm line.
 */
const SIZES = { sm: 14, md: 18, lg: 26 } as const;

export default function StarRating({
  value,
  size = "md",
}: {
  value: number;
  size?: "sm" | "md" | "lg";
}) {
  const clamped = Math.max(0, Math.min(5, value));
  const px = SIZES[size];

  return (
    <div
      className="inline-flex items-center gap-1.5"
      aria-label={`${clamped} out of 5`}
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const remainder = clamped - i;
        return (
          <Rosette key={i} fill={remainder >= 0.75 ? 1 : remainder >= 0.25 ? 0.5 : 0} px={px} />
        );
      })}
    </div>
  );
}

function Rosette({ fill, px }: { fill: 0 | 0.5 | 1; px: number }) {
  return (
    <span className="relative inline-block leading-none" style={{ width: px, height: px }}>
      <RosetteMark px={px} className="text-line" />
      {fill > 0 && (
        <span
          className="absolute inset-0 overflow-hidden"
          style={{ width: fill === 1 ? px : px / 2 }}
        >
          <RosetteMark px={px} className="text-gold" />
        </span>
      )}
    </span>
  );
}

function RosetteMark({ px, className }: { px: number; className?: string }) {
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <ellipse key={angle} cx="12" cy="6.7" rx="2.9" ry="5.3" transform={`rotate(${angle} 12 12)`} />
      ))}
      <circle cx="12" cy="12" r="3.3" />
    </svg>
  );
}
