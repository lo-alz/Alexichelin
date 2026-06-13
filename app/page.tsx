"use client";

import { useEffect, useMemo, useState } from "react";
import { DEFAULT_CRITERIA, SOURCES, type ScoreCard } from "@/lib/schema";
import { personalizedScore, roundToHalf, weightedSourceScore } from "@/lib/scoring";
import SearchForm from "@/components/SearchForm";
import CriteriaControls, { type CriterionPref } from "@/components/CriteriaControls";
import CriteriaBreakdown from "@/components/CriteriaBreakdown";
import SourceControls, { type SourcePref } from "@/components/SourceControls";
import SourceWeightControls from "@/components/SourceWeightControls";
import RestaurantHeader from "@/components/RestaurantHeader";
import CombinedScore from "@/components/CombinedScore";
import SourceCard from "@/components/SourceCard";

const PREFS_KEY = "rosette.criteria";
const WEIGHTS_KEY = "rosette.weights";
const SOURCES_KEY = "rosette.sources";

function defaultPrefs(): CriterionPref[] {
  return DEFAULT_CRITERIA.map((name, i) => ({
    id: `default-${i}`,
    name,
    importance: 60,
    enabled: true,
  }));
}

function defaultSourcePrefs(): SourcePref[] {
  return SOURCES.map((name, i) => ({ id: `src-default-${i}`, name, enabled: true }));
}

function defaultWeights(): Record<string, number> {
  return Object.fromEntries(SOURCES.map((s) => [s, 50]));
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreCard | null>(null);
  const [prefs, setPrefs] = useState<CriterionPref[]>(defaultPrefs);
  const [sourcePrefs, setSourcePrefs] = useState<SourcePref[]>(defaultSourcePrefs);
  const [weights, setWeights] = useState<Record<string, number>>(defaultWeights);

  // Restore saved preferences once on mount.
  useEffect(() => {
    try {
      const p = localStorage.getItem(PREFS_KEY);
      if (p) setPrefs(JSON.parse(p));
      const s = localStorage.getItem(SOURCES_KEY);
      if (s) setSourcePrefs(JSON.parse(s));
      const w = localStorage.getItem(WEIGHTS_KEY);
      if (w) setWeights({ ...defaultWeights(), ...JSON.parse(w) });
    } catch {
      /* ignore malformed storage */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      /* ignore */
    }
  }, [prefs]);
  useEffect(() => {
    try {
      localStorage.setItem(SOURCES_KEY, JSON.stringify(sourcePrefs));
    } catch {
      /* ignore */
    }
  }, [sourcePrefs]);
  useEffect(() => {
    try {
      localStorage.setItem(WEIGHTS_KEY, JSON.stringify(weights));
    } catch {
      /* ignore */
    }
  }, [weights]);

  const importances = useMemo(
    () => Object.fromEntries(prefs.map((p) => [p.name, p.importance])),
    [prefs],
  );

  const personalized = useMemo(
    () => (result ? personalizedScore(result.criteria, importances) : null),
    [result, importances],
  );
  const consensus = useMemo(
    () => (result ? weightedSourceScore(result.sources, weights) : null),
    [result, weights],
  );

  function setImportance(name: string, value: number) {
    setPrefs((prev) => prev.map((p) => (p.name === name ? { ...p, importance: value } : p)));
  }

  async function handleAssess(restaurant: string, location: string) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const criteria = prefs.filter((p) => p.enabled).map((p) => p.name);
      const sources = sourcePrefs.filter((s) => s.enabled).map((s) => s.name);
      const res = await fetch("/api/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurant, location: location || undefined, criteria, sources }),
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
        <h1 className="font-display text-6xl font-semibold tracking-tight sm:text-7xl">Rosette</h1>
        <div className="mx-auto mt-5 h-px w-16 bg-gold" />
        <p className="mt-5 font-display text-xl italic text-muted">Every review, one verdict.</p>
        <p className="mx-auto mt-3 max-w-xl text-ink/70">
          A restaurant&apos;s standing across Reddit, Instagram, Google and the Michelin Guide —
          graded against what <em>you</em> care about, and distilled into one personalized score.
        </p>
      </header>

      <div className="mt-14">
        <SearchForm onSubmit={handleAssess} loading={loading} />
      </div>

      <div className="mt-8 space-y-6">
        <CriteriaControls criteria={prefs} onChange={setPrefs} disabled={loading} />
        <SourceControls sources={sourcePrefs} onChange={setSourcePrefs} disabled={loading} />
      </div>

      {loading && <LoadingState />}
      {error && !loading && <ErrorState message={error} />}
      {result && !loading && (
        <Results
          result={result}
          personalized={personalized}
          consensus={consensus}
          importances={importances}
          onImportance={setImportance}
          weights={weights}
          onWeights={setWeights}
        />
      )}
      {!result && !loading && !error && <EmptyState />}

      <footer className="mt-24 border-t border-line pt-6 text-center text-sm italic text-muted">
        Scores are considered estimates drawn from public sources — a guide, not an official rating.
      </footer>
    </main>
  );
}

function Results({
  result,
  personalized,
  consensus,
  importances,
  onImportance,
  weights,
  onWeights,
}: {
  result: ScoreCard;
  personalized: number | null;
  consensus: number | null;
  importances: Record<string, number>;
  onImportance: (name: string, value: number) => void;
  weights: Record<string, number>;
  onWeights: (next: Record<string, number>) => void;
}) {
  const hero =
    personalized !== null
      ? { label: "Your Score", score: personalized, subtitle: "Personalized to what you value." }
      : { label: "Combined Score", score: result.combinedScore, subtitle: undefined };

  return (
    <section className="mt-16 space-y-12">
      <RestaurantHeader restaurant={result.restaurant} />

      <CombinedScore
        label={hero.label}
        score={hero.score}
        starRating={roundToHalf(hero.score)}
        verdict={result.verdict}
        subtitle={hero.subtitle}
      />

      {result.criteria.length > 0 && (
        <CriteriaBreakdown
          criteria={result.criteria}
          importances={importances}
          onImportance={onImportance}
        />
      )}

      <div>
        <p className="label mb-1 text-center">By Source</p>
        {consensus !== null && (
          <p className="mb-6 text-center font-display text-lg italic text-muted">
            Weighted consensus {consensus.toFixed(1)} / 5
          </p>
        )}
        <div className="mb-6">
          <SourceWeightControls
            sources={result.sources.map((s) => s.source)}
            weights={weights}
            onChange={onWeights}
          />
        </div>
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
        Reading Reddit, Instagram, Google and the Michelin Guide, and grading your criteria. A
        moment, please — twenty to forty seconds.
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
