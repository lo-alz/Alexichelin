"use client";

import { useState } from "react";

export default function SearchForm({
  onSubmit,
  loading,
}: {
  onSubmit: (restaurant: string, location: string) => void;
  loading: boolean;
}) {
  const [restaurant, setRestaurant] = useState("");
  const [location, setLocation] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!restaurant.trim() || loading) return;
    onSubmit(restaurant, location);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 sm:flex-row sm:items-end">
      <Field label="Restaurant" className="flex-1">
        <input
          type="text"
          value={restaurant}
          onChange={(e) => setRestaurant(e.target.value)}
          placeholder="Carbone"
          className="w-full border-0 border-b border-line bg-transparent pb-2 text-2xl font-display text-ink outline-none transition-colors placeholder:italic placeholder:text-muted/60 focus:border-ink"
          disabled={loading}
          autoFocus
        />
      </Field>

      <Field label="City / area" className="sm:w-64">
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
