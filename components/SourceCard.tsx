import type { SourceScore } from "@/lib/schema";
import StarRating from "./StarRating";

const CONFIDENCE_DOTS = { high: 3, medium: 2, low: 1 } as const;

export default function SourceCard({ source }: { source: SourceScore }) {
  const hasScore = source.score !== null;

  return (
    <div className="flex h-full flex-col border border-line bg-card p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="label !text-ink !text-sm">{source.source}</h3>
          <ConfidenceDots level={source.confidence} />
        </div>

        <div className="text-right">
          {hasScore ? (
            <span className="font-display text-4xl font-semibold leading-none text-gold">
              {source.score!.toFixed(1)}
            </span>
          ) : (
            <span className="font-display text-3xl leading-none text-line">—</span>
          )}
        </div>
      </div>

      {hasScore ? (
        <div className="mt-3">
          <StarRating value={source.score!} size="sm" />
          {source.nativeRating && (
            <p className="mt-1.5 text-sm italic text-muted">{source.nativeRating}</p>
          )}
        </div>
      ) : (
        <p className="mt-3 text-sm italic text-muted">No strong signal found</p>
      )}

      <p className="mt-4 leading-relaxed text-ink/85">{source.summary}</p>

      {source.highlights.length > 0 && (
        <ul className="mt-4 space-y-1.5 text-[0.95rem] text-ink/75">
          {source.highlights.map((h, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="text-gold">—</span>
              <span>{h}</span>
            </li>
          ))}
        </ul>
      )}

      {source.citations.length > 0 && (
        <div className="mt-auto pt-6">
          <p className="label mb-2">Sources</p>
          <ul className="space-y-1.5">
            {source.citations.slice(0, 4).map((c, i) => (
              <li key={i} className="truncate">
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[0.95rem] text-ink underline decoration-line underline-offset-4 transition-colors hover:text-gold hover:decoration-gold"
                  title={c.title}
                >
                  {c.title || c.url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ConfidenceDots({ level }: { level: SourceScore["confidence"] }) {
  const filled = CONFIDENCE_DOTS[level];
  return (
    <span
      className="mt-2 flex items-center gap-1.5"
      title={`${level} confidence`}
      aria-label={`${level} confidence`}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${i < filled ? "bg-gold" : "bg-line"}`}
        />
      ))}
      <span className="label ml-1 !text-[0.625rem]">{level}</span>
    </span>
  );
}
