"use client";

import { useEffect, useRef, useState } from "react";

interface Suggestion {
  name: string;
  city: string;
  area: string;
}

export default function SearchForm({
  onSubmit,
  loading,
}: {
  onSubmit: (restaurant: string, location: string) => void;
  loading: boolean;
}) {
  const [restaurant, setRestaurant] = useState("");
  const [location, setLocation] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [active, setActive] = useState(-1);
  const skipNext = useRef(false);

  // Debounced restaurant autocomplete.
  useEffect(() => {
    if (skipNext.current) {
      skipNext.current = false;
      return;
    }
    const q = restaurant.trim();
    if (q.length < 3) {
      setSuggestions([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        if (!res.ok) return;
        const data = await res.json();
        setSuggestions(data.suggestions ?? []);
        setActive(-1);
      } catch {
        /* aborted or failed — ignore */
      }
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [restaurant]);

  function choose(s: Suggestion) {
    skipNext.current = true;
    setRestaurant(s.name);
    if (s.city) setLocation(s.city);
    setSuggestions([]);
    setActive(-1);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!restaurant.trim() || loading) return;
    setSuggestions([]);
    onSubmit(restaurant, location);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a <= 0 ? suggestions.length - 1 : a - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      choose(suggestions[active]);
    } else if (e.key === "Escape") {
      setSuggestions([]);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 sm:flex-row sm:items-end">
      <div className="relative flex-1">
        <Field label="Restaurant">
          <input
            type="text"
            value={restaurant}
            onChange={(e) => setRestaurant(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={() => setTimeout(() => setSuggestions([]), 150)}
            placeholder="Carbone"
            className="w-full border-0 border-b border-line bg-transparent pb-2 text-2xl font-display text-ink outline-none transition-colors placeholder:italic placeholder:text-muted/60 focus:border-ink"
            disabled={loading}
            autoFocus
            autoComplete="off"
            role="combobox"
            aria-expanded={suggestions.length > 0}
            aria-autocomplete="list"
          />
        </Field>

        {suggestions.length > 0 && (
          <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto border border-line bg-paper shadow-lg">
            {suggestions.map((s, i) => (
              <li key={`${s.name}-${i}`}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choose(s);
                  }}
                  className={`block w-full px-4 py-2.5 text-left transition-colors ${
                    i === active ? "bg-card" : "hover:bg-card"
                  }`}
                >
                  <span className="block font-display text-lg text-ink">{s.name}</span>
                  <span className="block truncate text-xs italic text-muted">
                    {s.area || s.city}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Field label="City / area" className="sm:w-56">
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="New York (optional)"
          className="w-full border-0 border-b border-line bg-transparent pb-2 text-2xl font-display text-ink outline-none transition-colors placeholder:italic placeholder:text-muted/60 focus:border-ink"
          disabled={loading}
        />
      </Field>

      <button
        type="submit"
        disabled={loading || !restaurant.trim()}
        className="label border border-ink px-7 py-3 text-ink transition-colors hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:border-line disabled:text-muted disabled:hover:bg-transparent"
      >
        {loading ? "Assessing" : "Assess"}
      </button>
    </form>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="label mb-3 block">{label}</span>
      {children}
    </label>
  );
}
