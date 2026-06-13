"use client";

import { useState } from "react";
import { SUGGESTED_SOURCES } from "@/lib/schema";

export interface SourcePref {
  id: string;
  name: string;
  enabled: boolean;
  custom?: boolean;
}

/** "Sources" — choose which review platforms to aggregate. */
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

  function toggle(id: string) {
    onChange(sources.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  }
  function remove(id: string) {
    onChange(sources.filter((s) => s.id !== id));
  }
  function add(name: string, custom = false) {
    // Split on commas so several sources can be added at once.
    const names = name
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const seen = new Set(present);
    const additions: SourcePref[] = [];
    names.forEach((n, i) => {
      if (seen.has(n.toLowerCase())) return;
      seen.add(n.toLowerCase());
      additions.push({ id: `src-${Date.now()}-${i}`, name: n, enabled: true, custom });
    });
    if (additions.length) onChange([...sources, ...additions]);
  }

  return (
    <section className="border border-line bg-card p-7">
      <p className="label">Sources</p>
      <p className="mt-2 text-sm italic text-muted">
        Choose which platforms to aggregate. Tap to toggle.
      </p>

      <div className="mt-5 flex flex-wrap gap-2.5">
        {sources.map((s) => (
          <span key={s.id} className="inline-flex items-center">
            <button
              type="button"
              onClick={() => toggle(s.id)}
              disabled={disabled}
              aria-pressed={s.enabled}
              className={`label !text-[0.7rem] border px-3.5 py-2 transition-colors ${
                s.enabled
                  ? "border-gold bg-gold/10 text-ink"
                  : "border-line text-muted hover:border-ink"
              }`}
            >
              {s.name}
            </button>
            {s.custom && (
              <button
                type="button"
                onClick={() => remove(s.id)}
                disabled={disabled}
                className="ml-1 text-muted transition-colors hover:text-ink"
                aria-label={`Remove ${s.name}`}
                title="Remove"
              >
                ×
              </button>
            )}
          </span>
        ))}
      </div>

      {suggestions.length > 0 && (
        <div className="mt-5">
          <p className="label !text-[0.625rem] text-muted">Add a source</p>
          <div className="mt-2.5 flex flex-wrap gap-2.5">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => add(s)}
                disabled={disabled}
                className="border border-dashed border-line px-3.5 py-2 text-sm italic text-muted transition-colors hover:border-gold hover:text-ink"
              >
                + {s}
              </button>
            ))}
          </div>
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
