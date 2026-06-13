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
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <input
        type="text"
        value={restaurant}
        onChange={(e) => setRestaurant(e.target.value)}
        placeholder="Restaurant name (e.g. Carbone)"
        className="flex-1 rounded-lg border border-stone-300 bg-white px-4 py-3 text-base outline-none focus:border-ink"
        disabled={loading}
        autoFocus
      />
      <input
        type="text"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="City / area (optional)"
        className="rounded-lg border border-stone-300 bg-white px-4 py-3 text-base outline-none focus:border-ink sm:w-56"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading || !restaurant.trim()}
        className="rounded-lg bg-ink px-6 py-3 font-medium text-cream transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Assessing…" : "Assess"}
      </button>
    </form>
  );
}
