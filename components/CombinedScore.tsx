import StarRating from "./StarRating";

export default function CombinedScore({
  label = "Combined Score",
  score,
  starRating,
  verdict,
  subtitle,
}: {
  label?: string;
  score: number;
  starRating: number;
  verdict?: string;
  subtitle?: string;
}) {
  return (
    <div className="border-y border-line py-12 text-center">
      <p className="label">{label}</p>

      <div className="mt-4 flex items-baseline justify-center gap-2">
        <span className="font-display text-7xl font-semibold leading-none text-gold sm:text-8xl">
          {score.toFixed(1)}
        </span>
        <span className="font-display text-3xl text-muted">/ 5</span>
      </div>

      <div className="mt-5 flex justify-center">
        <StarRating value={starRating} size="lg" />
      </div>

      {subtitle && <p className="mt-4 text-sm italic text-muted">{subtitle}</p>}

      {verdict && (
        <p className="mx-auto mt-6 max-w-xl font-display text-2xl italic leading-snug text-ink">
          “{verdict}”
        </p>
      )}
    </div>
  );
}
