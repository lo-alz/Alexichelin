import type { CriterionScore, SourceScore } from "./schema";

/** How much each confidence level counts when blending scores. */
const CONFIDENCE_WEIGHT = { high: 1, medium: 0.6, low: 0.3 } as const;

/** Round to the nearest half, for the star row. */
export function roundToHalf(n: number): number {
  return Math.round(n * 2) / 2;
}

/**
 * Confidence-weighted average of the per-source scores, with a user weight
 * (0–100) applied per source. Sources with a null score, zero weight, or that
 * the user has muted are ignored. Returns null when nothing is left to average.
 */
export function weightedSourceScore(
  sources: SourceScore[],
  weights: Record<string, number>,
): number | null {
  let num = 0;
  let den = 0;
  for (const s of sources) {
    if (s.score === null) continue;
    const userWeight = weights[s.source] ?? 50;
    const w = (userWeight / 100) * CONFIDENCE_WEIGHT[s.confidence];
    if (w <= 0) continue;
    num += w * s.score;
    den += w;
  }
  return den > 0 ? num / den : null;
}

/**
 * The personalized score: an importance-weighted blend of the per-criterion
 * grades. `importances` maps criterion name → 0–100. Criteria with a null score
 * or zero importance are skipped. Returns null when nothing is left to average.
 */
export function personalizedScore(
  criteria: CriterionScore[],
  importances: Record<string, number>,
): number | null {
  let num = 0;
  let den = 0;
  for (const c of criteria) {
    if (c.score === null) continue;
    const importance = importances[c.name] ?? 50;
    const w = (importance / 100) * CONFIDENCE_WEIGHT[c.confidence];
    if (w <= 0) continue;
    num += w * c.score;
    den += w;
  }
  return den > 0 ? num / den : null;
}
