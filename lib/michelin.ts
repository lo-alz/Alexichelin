/**
 * Michelin uses its own scale (Bib Gourmand, 1–3 Stars, the Plate) — not a 0–5
 * rating. We parse the model's native Michelin text into a distinction so the
 * Michelin card can show the real symbol, with the Rosette 0–5 as a secondary
 * translation.
 */
export type MichelinKind = "star" | "bib" | "plate" | "none" | "unknown";

export interface MichelinDistinction {
  kind: MichelinKind;
  stars: number;
  label: string;
}

export function parseMichelin(
  nativeRating: string | null,
  summary: string,
): MichelinDistinction {
  const t = `${nativeRating ?? ""} ${summary ?? ""}`.toLowerCase();

  if (/bib\s*gourmand/.test(t)) return { kind: "bib", stars: 0, label: "Bib Gourmand" };

  let stars = 0;
  if (/★★★|three[\s-]*star|3[\s-]*star|3\s*michelin\s*star/.test(t)) stars = 3;
  else if (/★★|two[\s-]*star|2[\s-]*star|2\s*michelin\s*star/.test(t)) stars = 2;
  else if (/★|one[\s-]*star|1[\s-]*star|1\s*michelin\s*star/.test(t)) stars = 1;
  if (stars) {
    return { kind: "star", stars, label: `${stars} Michelin Star${stars > 1 ? "s" : ""}` };
  }

  if (/michelin\s*plate|the\s*plate|assiette/.test(t))
    return { kind: "plate", stars: 0, label: "Michelin Plate" };
  if (/selected|recommended|in\s*the\s*guide|guide\s*listing/.test(t))
    return { kind: "plate", stars: 0, label: "Michelin Selected" };
  if (/not\s*(listed|in|featured|recognized|rated|part)|isn'?t\s*listed|no\s*michelin/.test(t))
    return { kind: "none", stars: 0, label: "Not in the Guide" };

  return { kind: "unknown", stars: 0, label: nativeRating || "Not listed" };
}
