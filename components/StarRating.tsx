/** Renders a 0–5 rating as filled / half / empty stars in muted gold. */
export default function StarRating({
  value,
  size = "md",
}: {
  value: number;
  size?: "sm" | "md" | "lg";
}) {
  const clamped = Math.max(0, Math.min(5, value));
  const sizeClass = size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-lg";

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${sizeClass}`}
      aria-label={`${clamped} out of 5`}
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const remainder = clamped - i;
        return <Star key={i} fill={remainder >= 0.75 ? 1 : remainder >= 0.25 ? 0.5 : 0} />;
      })}
    </div>
  );
}

function Star({ fill }: { fill: 0 | 0.5 | 1 }) {
  return (
    <span className="relative inline-block leading-none">
      <span className="text-line">★</span>
      {fill > 0 && (
        <span
          className="absolute inset-0 overflow-hidden text-gold"
          style={{ width: fill === 1 ? "100%" : "50%" }}
        >
          ★
        </span>
      )}
    </span>
  );
}
