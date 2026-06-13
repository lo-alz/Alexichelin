"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_CRITERIA, SOURCES, type ScoreCard } from "@/lib/schema";
import { personalizedScore, roundToHalf, weightedSourceScore } from "@/lib/scoring";
import SearchForm from "@/components/SearchForm";
import CriteriaControls, { type CriterionPref } from "@/components/CriteriaControls";
import CriteriaBreakdown from "@/components/CriteriaBreakdown";
import SourceControls, { type SourcePref } from "@/components/SourceControls";
import RestaurantHeader from "@/components/RestaurantHeader";
import ImageCarousel from "@/components/ImageCarousel";
import CombinedScore from "@/components/CombinedScore";
import SourceCard from "@/components/SourceCard";

const PREFS_KEY = "rosette.criteria";
const SOURCES_KEY = "rosette.sources.v2";

function defaultPrefs(): CriterionPref[] {
  return DEFAULT_CRITERIA.map((name, i) => ({
    id: `default-${i}`,
    name,
    importance: 60,
    enabled: true,
  }));
}

function defaultSourcePrefs(): SourcePref[] {
  return SOURCES.map((name, i) => ({ id: `src-default-${i}`, name, enabled: true, weight: 50 }));
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreCard | null>(null);
  const [prefs, setPrefs] = useState<CriterionPref[]>(defaultPrefs);
  const [sourcePrefs, setSourcePrefs] = useState<SourcePref[]>(defaultSourcePrefs);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Restore saved preferences once on mount.
  useEffect(() => {
    try {
      const p = localStorage.getItem(PREFS_KEY);
      if (p) setPrefs(JSON.parse(p));
      const s = localStorage.getItem(SOURCES_KEY);
      if (s) setSourcePrefs(JSON.parse(s));
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

  // Slide to the result once it arrives.
  useEffect(() => {
    if (result && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  const importances = useMemo(
    () => Object.fromEntries(prefs.map((p) => [p.name, p.importance])),
    [prefs],
  );
  const weights = useMemo(
    () => Object.fromEntries(sourcePrefs.map((s) => [s.name, s.weight])),
    [sourcePrefs],
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
    <main className="mx-auto max-w-3xl px-5 py-12 sm:px-6 sm:py-20">
      <header className="text-center">
        <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-7xl">Rosette</h1>
        <div className="mx-auto mt-4 h-px w-16 bg-gold" />
        <p className="mt-4 font-display text-lg italic text-muted sm:text-xl">
          Every review, one verdict.
        </p>
        <p className="mx-auto mt-3 max-w-xl text-sm text-ink/70 sm:text-base">
          A restaurant&apos;s standing across your chosen sources — graded against what{" "}
          <em>you</em> care about, distilled into one personalized score.
        </p>
      </header>

      <div className="mt-10">
        <SearchForm onSubmit={handleAssess} loading={loading} />
      </div>

      <div className="mt-7 space-y-5">
        <CriteriaControls criteria={prefs} onChange={setPrefs} disabled={loading} />
        <SourceControls sources={sourcePrefs} onChange={setSourcePrefs} disabled={loading} />
      </div>

      <div ref={resultsRef} className="scroll-mt-6">
        {loading && <LoadingState />}
        {error && !loading && <ErrorState message={error} />}
        {result && !loading && (
          <Results
            result={result}
            personalized={personalized}
            consensus={consensus}
            importances={importances}
            onImportance={setImportance}
          />
        )}
        {!result && !loading && !error && <EmptyState />}
      </div>

      <footer className="mt-20 border-t border-line pt-6 text-center text-xs italic text-muted sm:text-sm">
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
}: {
  result: ScoreCard;
  personalized: number | null;
  consensus: number | null;
  importances: Record<string, number>;
  onImportance: (name: string, value: number) => void;
}) {
  const hero =
    personalized !== null
      ? { label: "Your Score", score: personalized, subtitle: "Personalized to what you value." }
      : { label: "Combined Score", score: result.combinedScore, subtitle: undefined };

  return (
    <section className="mt-12 space-y-10">
      <RestaurantHeader restaurant={result.restaurant} />

      {result.restaurant.images.length > 0 && (
        <ImageCarousel images={result.restaurant.images} alt={result.restaurant.name} />
      )}

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
          <p className="mb-5 text-center font-display text-base italic text-muted">
            Weighted consensus {consensus.toFixed(1)} / 5
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {result.sources.map((s) => (
            <SourceCard
              key={s.source}
              source={s}
              restaurant={result.restaurant.name}
              location={result.restaurant.location}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function LoadingState() {
  return (
    <div className="mt-16 text-center">
      <p className="font-display text-2xl italic text-ink">Consulting the sources…</p>
      <div className="mx-auto mt-5 h-px w-12 animate-pulse bg-gold" />
      <p className="mt-4 text-sm text-muted">
        Reading your chosen sources and grading your criteria. A moment, please — twenty to forty
        seconds.
      </p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="mt-16 border-y border-line py-10 text-center">
      <p className="font-display text-2xl italic text-ink">We couldn&apos;t reach a verdict</p>
      <p className="mt-3 text-sm text-muted">{message}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-16 text-center text-muted">
      <p className="font-display text-xl italic">Name a restaurant to begin.</p>
      <p className="mt-2 text-sm">Add a city if the name is a common one.</p>
    </div>
  );
}
