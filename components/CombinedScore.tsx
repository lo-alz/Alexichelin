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
    <div className="rounded-2xl bg-ink px-6 py-8 text-cream">
      <p className="text-sm uppercase tracking-wide text-stone-400">Combined score</p>
      <div className="mt-2 flex items-end gap-3">
        <span className="font-serif text-6xl font-bold leading-none">
          {combinedScore.toFixed(1)}
        </span>
        <span className="pb-1 text-2xl text-stone-400">/ 5</span>
      </div>
      <div className="mt-3">
        <StarRating value={starRating} size="lg" />
      </div>
      {verdict && <p className="mt-4 max-w-xl text-stone-200">{verdict}</p>}
    </div>
  );
}
