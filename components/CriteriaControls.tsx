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
    const name = draft.trim();
    if (!name) return;
    if (criteria.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([
      ...criteria,
      { id: `custom-${Date.now()}`, name, importance: 60, enabled: true, custom: true },
    ]);
    setDraft("");
  }

  return (
    <section className="border border-line bg-card p-7">
      <p className="label">What matters to you</p>
      <p className="mt-2 text-sm italic text-muted">
        Turn on the things you care about and weight them. The verdict is graded from what
        reviewers actually say about each.
      </p>

      <div className="mt-6 space-y-4">
        {criteria.map((c) => (
          <div key={c.id} className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => update(c.id, { enabled: !c.enabled })}
              disabled={disabled}
              aria-pressed={c.enabled}
              className={`h-4 w-4 shrink-0 rounded-full border transition-colors ${
                c.enabled ? "border-gold bg-gold" : "border-line bg-transparent"
              }`}
              title={c.enabled ? "Enabled" : "Disabled"}
            />

            <div className="w-40 shrink-0">
              <span
                className={`font-display text-lg ${c.enabled ? "text-ink" : "text-muted line-through"}`}
              >
                {c.name}
              </span>
            </div>

            <div className="flex-1">
              <Slider
                value={c.importance}
                onChange={(v) => update(c.id, { importance: v, enabled: v > 0 ? c.enabled : c.enabled })}
                disabled={disabled || !c.enabled}
                ariaLabel={`${c.name} importance`}
              />
            </div>

            <span
              className={`label w-20 shrink-0 text-right !text-[0.625rem] ${
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
