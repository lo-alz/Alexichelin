"use client";

import { useState } from "react";
import type { SourceScore } from "@/lib/schema";
import StarRating from "./StarRating";

const CONFIDENCE_DOTS = { high: 3, medium: 2, low: 1 } as const;

/**
 * A source's grade. Condensed by default (name + score + confidence); tap to
 * expand the summary, highlights and citations. Mobile-first.
 */
export default function SourceCard({ source }: { source: SourceScore }) {
  const [open, setOpen] = useState(false);
  const hasScore = source.score !== null;
  const hasDetail =
    !!source.summary || source.highlights.length > 0 || source.citations.length > 0;

  return (
    <div className="border border-line bg-card">
      <button
        type="button"
        onClick={() => hasDetail && setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <div className="min-w-0">
          <h3 className="label !text-ink !text-sm">{source.source}</h3>
          <div className="mt-1.5 flex items-center gap-3">
            <ConfidenceDots level={source.confidence} />
            {hasScore && source.nativeRating && (
              <span className="truncate text-xs italic text-muted">{source.nativeRating}</span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {hasScore ? (
            <span className="font-display text-3xl font-semibold leading-none text-gold">
              {source.score!.toFixed(1)}
            </span>
          ) : (
            <span className="font-display text-2xl leading-none text-line">—</span>
          )}
          {hasDetail && (
            <span
              className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}
              aria-hidden
            >
              ⌄
            </span>
          )}
        </div>
      </button>

      {open && hasDetail && (
        <div className="border-t border-line px-5 pb-5 pt-4">
          {hasScore && (
            <div className="mb-3">
              <StarRating value={source.score!} size="sm" />
            </div>
          )}
          {source.summary && <p className="leading-relaxed text-ink/85">{source.summary}</p>}

          {source.highlights.length > 0 && (
            <ul className="mt-3 space-y-1.5 text-[0.95rem] text-ink/75">
              {source.highlights.map((h, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="text-gold">—</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          )}

          {source.citations.length > 0 && (
            <div className="mt-4">
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
      )}
    </div>
  );
}

function ConfidenceDots({ level }: { level: SourceScore["confidence"] }) {
  const filled = CONFIDENCE_DOTS[level];
  return (
    <span
      className="flex items-center gap-1.5"
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
