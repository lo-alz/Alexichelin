"use client";

import Slider, { weightLabel } from "./Slider";

/** "Who to trust" — weight how much each platform counts toward the source consensus. */
export default function SourceWeightControls({
  sources,
  weights,
  onChange,
}: {
  sources: string[];
  weights: Record<string, number>;
  onChange: (next: Record<string, number>) => void;
}) {
  return (
    <div className="border border-line bg-card p-7">
      <p className="label">Who to trust</p>
      <p className="mt-2 text-sm italic text-muted">
        Weight each source — the consensus updates instantly.
      </p>
      <div className="mt-6 grid gap-x-10 gap-y-4 sm:grid-cols-2">
        {sources.map((s) => {
          const v = weights[s] ?? 50;
          return (
            <div key={s} className="flex items-center gap-4">
              <span className="w-20 shrink-0 font-display text-lg text-ink">{s}</span>
              <div className="flex-1">
                <Slider
                  value={v}
                  onChange={(val) => onChange({ ...weights, [s]: val })}
                  ariaLabel={`${s} weight`}
                />
              </div>
              <span className="label w-20 shrink-0 text-right !text-[0.625rem] text-gold">
                {weightLabel(v)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
