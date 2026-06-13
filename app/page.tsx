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
    <main className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
      <header className="text-center">
        <h1 className="font-display text-6xl font-semibold tracking-tight sm:text-7xl">
          Rosette
        </h1>
        <div className="mx-auto mt-5 h-px w-16 bg-gold" />
        <p className="mt-5 font-display text-xl italic text-muted">
          Every review, one verdict.
        </p>
        <p className="mx-auto mt-3 max-w-xl text-ink/70">
          A restaurant&apos;s standing across Reddit, Instagram, Google and the Michelin Guide —
          considered, weighed, and distilled into a single score.
        </p>
      </header>

      <div className="mt-14">
        <SearchForm onSubmit={handleAssess} loading={loading} />
      </div>

      {loading && <LoadingState />}
      {error && !loading && <ErrorState message={error} />}
      {result && !loading && <Results result={result} />}
      {!result && !loading && !error && <EmptyState />}

      <footer className="mt-24 border-t border-line pt-6 text-center text-sm italic text-muted">
        Scores are considered estimates drawn from public sources — a guide, not an official rating.
      </footer>
    </main>
  );
}

function Results({ result }: { result: ScoreCard }) {
  return (
    <section className="mt-16 space-y-12">
      <RestaurantHeader restaurant={result.restaurant} />
      <CombinedScore
        combinedScore={result.combinedScore}
        starRating={result.starRating}
        verdict={result.verdict}
      />
      <div>
        <p className="label mb-5 text-center">By Source</p>
        <div className="grid gap-5 sm:grid-cols-2">
          {result.sources.map((s) => (
            <SourceCard key={s.source} source={s} />
          ))}
        </div>
      </div>
    </section>
  );
}

function LoadingState() {
  return (
    <div className="mt-20 text-center">
      <p className="font-display text-2xl italic text-ink">Consulting the sources…</p>
      <div className="mx-auto mt-5 h-px w-12 animate-pulse bg-gold" />
      <p className="mt-4 text-sm text-muted">
        Reading Reddit, Instagram, Google and the Michelin Guide. A moment, please — twenty to
        forty seconds.
      </p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="mt-20 border-y border-line py-10 text-center">
      <p className="font-display text-2xl italic text-ink">We couldn&apos;t reach a verdict</p>
      <p className="mt-3 text-sm text-muted">{message}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-20 text-center text-muted">
      <p className="font-display text-xl italic">Name a restaurant to begin.</p>
      <p className="mt-2 text-sm">Add a city if the name is a common one.</p>
    </div>
  );
}
