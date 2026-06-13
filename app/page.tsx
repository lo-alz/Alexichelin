"use client";

import { useState } from "react";
import type { ScoreCard } from "@/lib/schema";
import SearchForm from "@/components/SearchForm";
import RestaurantHeader from "@/components/RestaurantHeader";
import CombinedScore from "@/components/CombinedScore";
import SourceCard from "@/components/SourceCard";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreCard | null>(null);

  async function handleAssess(restaurant: string, location: string) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurant, location: location || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Request failed.");
      setResult(data as ScoreCard);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:py-16">
      <header className="mb-8">
        <h1 className="font-serif text-4xl font-bold sm:text-5xl">Alexichelin</h1>
        <p className="mt-2 max-w-2xl text-stone-600">
          Type a restaurant. We assess its reputation across Reddit, Instagram, Google and
          Michelin, then combine them into one score.
        </p>
      </header>

      <SearchForm onSubmit={handleAssess} loading={loading} />

      {loading && <LoadingState />}
      {error && !loading && <ErrorState message={error} />}
      {result && !loading && <Results result={result} />}
      {!result && !loading && !error && <EmptyState />}

      <footer className="mt-16 border-t border-stone-200 pt-6 text-sm text-stone-400">
        Scores are AI-generated from public web sources and are estimates, not official ratings.
      </footer>
    </main>
  );
}

function Results({ result }: { result: ScoreCard }) {
  return (
    <section className="mt-10 space-y-8">
      <RestaurantHeader restaurant={result.restaurant} />
      <CombinedScore
        combinedScore={result.combinedScore}
        starRating={result.starRating}
        verdict={result.verdict}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {result.sources.map((s) => (
          <SourceCard key={s.source} source={s} />
        ))}
      </div>
    </section>
  );
}

function LoadingState() {
  return (
    <div className="mt-10 rounded-2xl border border-stone-200 bg-white p-8 text-center">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-ink" />
      <p className="mt-4 font-medium">Researching the sources…</p>
      <p className="mt-1 text-sm text-stone-500">
        Searching Reddit, Instagram, Google and Michelin. This can take 20–40 seconds.
      </p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
      <p className="font-medium">Couldn&apos;t build the scorecard</p>
      <p className="mt-1 text-sm">{message}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-10 rounded-2xl border border-dashed border-stone-300 p-8 text-center text-stone-500">
      <p>Search a restaurant above to see its combined scorecard.</p>
      <p className="mt-1 text-sm">Tip: add a city if the name is common.</p>
    </div>
  );
}
