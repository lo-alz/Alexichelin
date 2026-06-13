import type { Source, SourceScore } from "@/lib/schema";
import StarRating from "./StarRating";

const SOURCE_STYLE: Record<Source, { badge: string; accent: string }> = {
  Reddit: { badge: "bg-orange-100 text-orange-700", accent: "text-orange-600" },
  Instagram: { badge: "bg-pink-100 text-pink-700", accent: "text-pink-600" },
  Google: { badge: "bg-blue-100 text-blue-700", accent: "text-blue-600" },
  Michelin: { badge: "bg-red-100 text-red-700", accent: "text-red-600" },
};

const CONFIDENCE_STYLE = {
  high: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-stone-200 text-stone-600",
} as const;

export default function SourceCard({ source }: { source: SourceScore }) {
  const style = SOURCE_STYLE[source.source];
  const hasScore = source.score !== null;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-stone-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${style.badge}`}>
          {source.source}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${CONFIDENCE_STYLE[source.confidence]}`}
          title="How much signal was found"
        >
          {source.confidence} confidence
        </span>
      </div>

      <div className="mt-4">
        {hasScore ? (
          <div className="flex items-center gap-3">
            <span className={`text-3xl font-bold ${style.accent}`}>
              {source.score!.toFixed(1)}
            </span>
            <StarRating value={source.score!} size="sm" />
          </div>
        ) : (
          <p className="text-sm font-medium text-stone-400">No strong signal found</p>
        )}
        {source.nativeRating && (
          <p className="mt-1 text-sm text-stone-500">{source.nativeRating}</p>
        )}
      </div>

      <p className="mt-3 text-sm text-stone-700">{source.summary}</p>

      {source.highlights.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-stone-600">
          {source.highlights.map((h, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-stone-400">•</span>
              <span>{h}</span>
            </li>
          ))}
        </ul>
      )}

      {source.citations.length > 0 && (
        <div className="mt-auto pt-4">
          <p className="mb-1 text-xs uppercase tracking-wide text-stone-400">Sources</p>
          <ul className="space-y-1">
            {source.citations.slice(0, 4).map((c, i) => (
              <li key={i} className="truncate">
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                  title={c.title}
                >
                  {c.title || c.url} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
