import StarRating from "./StarRating";

export default function CombinedScore({
  combinedScore,
  starRating,
  verdict,
}: {
  combinedScore: number;
  starRating: number;
  verdict: string;
}) {
  return (
    <div className="border-y border-line py-12 text-center">
      <p className="label">Combined Score</p>

      <div className="mt-4 flex items-baseline justify-center gap-2">
        <span className="font-display text-7xl font-semibold leading-none text-gold sm:text-8xl">
          {combinedScore.toFixed(1)}
        </span>
        <span className="font-display text-3xl text-muted">/ 5</span>
      </div>

      <div className="mt-5 flex justify-center">
        <StarRating value={starRating} size="lg" />
      </div>

      {verdict && (
        <p className="mx-auto mt-6 max-w-xl font-display text-2xl italic leading-snug text-ink">
          “{verdict}”
        </p>
      )}
    </div>
  );
}
