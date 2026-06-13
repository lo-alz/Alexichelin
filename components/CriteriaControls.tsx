"use client";

import { useState } from "react";
import Slider, { weightLabel } from "./Slider";

export interface CriterionPref {
  id: string;
  name: string;
  /** 0–100 importance. */
  importance: number;
  enabled: boolean;
  /** User-added criteria can be removed; built-ins can only be toggled. */
  custom?: boolean;
}

/**
 * "What matters to you" — pick the criteria to grade and how much each counts.
 * Shown before assessing; the chosen importances also re-weight results live.
 */
export default function CriteriaControls({
  criteria,
  onChange,
  disabled,
}: {
  criteria: CriterionPref[];
  onChange: (next: CriterionPref[]) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");

  function update(id: string, patch: Partial<CriterionPref>) {
    onChange(criteria.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }
  function remove(id: string) {
    onChange(criteria.filter((c) => c.id !== id));
  }
  function addCustom() {
    // Split on commas so "Baby access, parking" becomes two criteria.
    const names = draft
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const existing = new Set(criteria.map((c) => c.name.toLowerCase()));
    const additions: CriterionPref[] = [];
    names.forEach((name, i) => {
      if (existing.has(name.toLowerCase())) return;
      existing.add(name.toLowerCase());
      additions.push({
        id: `custom-${Date.now()}-${i}`,
        name,
        importance: 60,
        enabled: true,
        custom: true,
      });
    });
    if (additions.length) onChange([...criteria, ...additions]);
    setDraft("");
  }

  return (
    <section className="border border-line bg-card p-7">
      <p className="label">What matters to you</p>
      <p className="mt-2 text-sm italic text-muted">
        Turn on the things you care about and weight them. The verdict is graded from what
        reviewers actually say about each.
      </p>

      <div className="mt-6 space-y-5 sm:space-y-4">
        {criteria.map((c) => (
          <div key={c.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-3 sm:w-44 sm:shrink-0">
              <button
                type="button"
                onClick={() => update(c.id, { enabled: !c.enabled })}
                disabled={disabled}
                aria-pressed={c.enabled}
                className={`h-[18px] w-[18px] shrink-0 rounded-full border transition-all ${
                  c.enabled
                    ? "border-transparent bg-gradient-to-br from-[#c2a566] to-[#8a6f3d] shadow-[0_1px_3px_rgba(33,28,22,0.3)]"
                    : "border-line bg-transparent hover:border-gold"
                }`}
                title={c.enabled ? "Enabled" : "Disabled"}
              />
              <span
                className={`flex-1 truncate font-display text-lg sm:flex-none ${
                  c.enabled ? "text-ink" : "text-muted line-through"
                }`}
              >
                {c.name}
              </span>
              {/* weight label sits on the name line on mobile */}
              <span
                className={`label shrink-0 !text-[0.625rem] sm:hidden ${
                  c.enabled ? "text-gold" : "text-line"
                }`}
              >
                {c.enabled ? weightLabel(c.importance) : "—"}
              </span>
              {c.custom && (
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  disabled={disabled}
                  className="shrink-0 text-muted transition-colors hover:text-ink"
                  title="Remove"
                  aria-label={`Remove ${c.name}`}
                >
                  ×
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 sm:flex-1">
              <div className="flex-1">
                <Slider
                  value={c.importance}
                  onChange={(v) => update(c.id, { importance: v })}
                  disabled={disabled || !c.enabled}
                  ariaLabel={`${c.name} importance`}
                />
              </div>
              {/* weight label sits inline on larger screens */}
              <span
                className={`label hidden w-16 shrink-0 text-right !text-[0.625rem] sm:inline ${
                  c.enabled ? "text-gold" : "text-line"
                }`}
              >
                {c.enabled ? weightLabel(c.importance) : "—"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3 border-t border-line pt-5">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="Add your own — e.g. Vegetarian options"
          disabled={disabled}
          className="flex-1 border-0 border-b border-line bg-transparent pb-1.5 font-display text-lg text-ink outline-none placeholder:italic placeholder:text-muted/60 focus:border-ink"
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={disabled || !draft.trim()}
          className="label text-muted transition-colors hover:text-ink disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </section>
  );
}
