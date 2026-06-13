/** Renders a 0–5 rating as filled / half / empty stars. */
export default function StarRating({
  value,
  size = "md",
}: {
  value: number;
  size?: "sm" | "md" | "lg";
}) {
  const clamped = Math.max(0, Math.min(5, value));
  const sizeClass = size === "lg" ? "text-3xl" : size === "sm" ? "text-base" : "text-xl";

  return (
    <div className={`inline-flex items-center gap-0.5 ${sizeClass}`} aria-label={`${clamped} out of 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, clamped - i)); // 0, 0.5-ish, or 1
        return <Star key={i} fill={fill >= 0.75 ? 1 : fill >= 0.25 ? 0.5 : 0} />;
      })}
    </div>
  );
}

function Star({ fill }: { fill: 0 | 0.5 | 1 }) {
  return (
    <span className="relative inline-block leading-none">
      <span className="text-stone-300">★</span>
      {fill > 0 && (
        <span
          className="absolute inset-0 overflow-hidden text-amber-500"
          style={{ width: fill === 1 ? "100%" : "50%" }}
        >
          ★
        </span>
      )}
    </span>
  );
}
