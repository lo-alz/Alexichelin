"use client";

import { useState } from "react";
import { SUGGESTED_SOURCES } from "@/lib/schema";
import Slider, { weightLabel } from "./Slider";

export interface SourcePref {
  id: string;
  name: string;
  enabled: boolean;
  /** 0–100 weight toward the source consensus. */
  weight: number;
  custom?: boolean;
}

/**
 * "Sources" — choose which platforms to aggregate and how much each counts.
 * Set up front (before assessing); the weights drive the consensus on results.
 */
export default function SourceControls({
  sources,
  onChange,
  disabled,
}: {
  sources: SourcePref[];
  onChange: (next: SourcePref[]) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const present = new Set(sources.map((s) => s.name.toLowerCase()));
  const suggestions = SUGGESTED_SOURCES.filter((s) => !present.has(s.toLowerCase()));

  function update(id: string, patch: Partial<SourcePref>) {
    onChange(sources.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }
  function remove(id: string) {
    onChange(sources.filter((s) => s.id !== id));
  }
  function add(name: string, custom = false) {
    const names = name
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const seen = new Set(present);
    const additions: SourcePref[] = [];
    names.forEach((n, i) => {
      if (seen.has(n.toLowerCase())) return;
      seen.add(n.toLowerCase());
      additions.push({ id: `src-${Date.now()}-${i}`, name: n, enabled: true, weight: 50, custom });
    });
    if (additions.length) onChange([...sources, ...additions]);
  }

  return (
    <section className="border border-line bg-card p-6 sm:p-7">
      <p className="label">Sources &amp; trust</p>
      <p className="mt-2 text-sm italic text-muted">
        Choose which platforms to aggregate and how much each one counts.
      </p>

      <div className="mt-5 space-y-5 sm:space-y-3.5">
        {sources.map((s) => (
          <div key={s.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex items-center gap-3 sm:w-28 sm:shrink-0">
              <button
                type="button"
                onClick={() => update(s.id, { enabled: !s.enabled })}
                disabled={disabled}
                aria-pressed={s.enabled}
                className={`h-[18px] w-[18px] shrink-0 rounded-full border transition-all ${
                  s.enabled
                    ? "border-transparent bg-gradient-to-br from-[#c2a566] to-[#8a6f3d] shadow-[0_1px_3px_rgba(33,28,22,0.3)]"
                    : "border-line bg-transparent hover:border-gold"
                }`}
                title={s.enabled ? "Enabled" : "Disabled"}
              />
              <span
                className={`flex-1 truncate font-display text-lg sm:flex-none ${
                  s.enabled ? "text-ink" : "text-muted line-through"
                }`}
              >
                {s.name}
              </span>
              <span
                className={`label shrink-0 !text-[0.625rem] sm:hidden ${
                  s.enabled ? "text-gold" : "text-line"
                }`}
              >
                {s.enabled ? weightLabel(s.weight) : "—"}
              </span>
              {s.custom && (
                <button
                  type="button"
                  onClick={() => remove(s.id)}
                  disabled={disabled}
                  className="shrink-0 text-muted transition-colors hover:text-ink"
                  aria-label={`Remove ${s.name}`}
                  title="Remove"
                >
                  ×
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 sm:flex-1">
              <div className="flex-1">
                <Slider
                  value={s.weight}
                  onChange={(v) => update(s.id, { weight: v })}
                  disabled={disabled || !s.enabled}
                  ariaLabel={`${s.name} weight`}
                />
              </div>
              <span
                className={`label hidden w-16 shrink-0 text-right !text-[0.625rem] sm:inline ${
                  s.enabled ? "text-gold" : "text-line"
                }`}
              >
                {s.enabled ? weightLabel(s.weight) : "—"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {suggestions.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2.5">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              disabled={disabled}
              className="border border-dashed border-line px-3 py-1.5 text-sm italic text-muted transition-colors hover:border-gold hover:text-ink"
            >
              + {s}
            </button>
          ))}
        </div>
      )}

      <div className="mt-5 flex items-center gap-3 border-t border-line pt-5">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(draft, true);
              setDraft("");
            }
          }}
          placeholder="Add your own — e.g. Zomato"
          disabled={disabled}
          className="flex-1 border-0 border-b border-line bg-transparent pb-1.5 font-display text-lg text-ink outline-none placeholder:italic placeholder:text-muted/60 focus:border-ink"
        />
        <button
          type="button"
          onClick={() => {
            add(draft, true);
            setDraft("");
          }}
          disabled={disabled || !draft.trim()}
          className="label text-muted transition-colors hover:text-ink disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </section>
  );
}
