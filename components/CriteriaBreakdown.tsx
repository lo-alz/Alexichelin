"use client";

import type { CriterionScore } from "@/lib/schema";
import StarRating from "./StarRating";
import Slider, { weightLabel } from "./Slider";

/**
 * Per-criterion grades from the assessment, each with a live importance slider
 * so the user can re-weight the personalized score without re-running.
 */
export default function CriteriaBreakdown({
  criteria,
  importances,
  onImportance,
}: {
  criteria: CriterionScore[];
  importances: Record<string, number>;
  onImportance: (name: string, value: number) => void;
}) {
  return (
    <div>
      <p className="label mb-5 text-center">What matters to you</p>
      <div className="space-y-4">
        {criteria.map((c) => {
          const hasScore = c.score !== null;
          const importance = importances[c.name] ?? 50;
          return (
            <div key={c.name} className="border border-line bg-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-xl text-ink">{c.name}</h3>
                  {hasScore ? (
                    <div className="mt-2">
                      <StarRating value={c.score!} size="sm" />
                    </div>
                  ) : (
                    <p className="mt-2 text-sm italic text-muted">No strong signal found</p>
                  )}
                </div>
                <span
                  className={`font-display text-3xl font-semibold leading-none ${
                    hasScore ? "text-gold" : "text-line"
                  }`}
                >
                  {hasScore ? c.score!.toFixed(1) : "—"}
                </span>
              </div>

              {c.summary && <p className="mt-3 leading-relaxed text-ink/85">{c.summary}</p>}

              <div className="mt-4 flex items-center gap-4 border-t border-line pt-4">
                <span className="label shrink-0 !text-[0.625rem] text-muted">Importance</span>
                <div className="flex-1">
                  <Slider
                    value={importance}
                    onChange={(v) => onImportance(c.name, v)}
                    ariaLabel={`${c.name} importance`}
                  />
                </div>
                <span className="label w-20 shrink-0 text-right !text-[0.625rem] text-gold">
                  {weightLabel(importance)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
