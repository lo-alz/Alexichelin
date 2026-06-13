import { z } from "zod";

/**
 * Default review sources shown in the UI. Sources are user-configurable (the
 * Sources panel lets you add/remove), so `source` is a free string, not a fixed
 * enum — this is just the starting set.
 */
export const SOURCES = ["Reddit", "Instagram", "Google", "Michelin"] as const;
export type Source = string;

/** One-tap suggestions offered in the Sources panel beyond the defaults. */
export const SUGGESTED_SOURCES = [
  "TripAdvisor",
  "Yelp",
  "OpenTable",
  "The Infatuation",
  "Eater",
  "TikTok",
  "Facebook",
] as const;

/**
 * Every field below uses `.catch(...)` so a single malformed/missing value
 * falls back to a sane default instead of failing the whole scorecard — smaller
 * models occasionally emit `NaN`, drop a field, or mistype one.
 */
const confidenceSchema = z.enum(["high", "medium", "low"]).catch("low");

export const citationSchema = z.object({
  title: z.string().catch(""),
  url: z.string().catch(""),
});

export const sourceScoreSchema = z.object({
  source: z.string().catch(""),
  /** Normalized 0–5 score, or null when no meaningful signal was found. */
  score: z.union([z.null(), z.coerce.number().min(0).max(5)]).catch(null),
  /** Native rating as found, e.g. "4.5/5 (1,203 reviews)", "1 Star", or null. */
  nativeRating: z.string().nullable().catch(null),
  confidence: confidenceSchema,
  summary: z.string().catch(""),
  highlights: z.array(z.string().catch("")).catch([]),
  citations: z.array(citationSchema).catch([]),
});
export type SourceScore = z.infer<typeof sourceScoreSchema>;

/** Default criteria offered in the UI; users can add their own. */
export const DEFAULT_CRITERIA = [
  "Food & drink",
  "Service",
  "Ambiance",
  "Value",
  "Accessibility",
] as const;

/**
 * The AI's grade for a single user-chosen criterion, derived from the substance
 * of the reviews (not just the headline star rating).
 */
export const criterionScoreSchema = z.object({
  name: z.string().catch(""),
  /** Normalized 0–5 score for this criterion, or null when reviews say little. */
  score: z.union([z.null(), z.coerce.number().min(0).max(5)]).catch(null),
  confidence: confidenceSchema,
  /** 1-sentence summary of what reviewers say about this specific criterion. */
  summary: z.string().catch(""),
});
export type CriterionScore = z.infer<typeof criterionScoreSchema>;

export const restaurantSchema = z.object({
  name: z.string().catch(""),
  location: z.string().catch(""),
  cuisine: z.string().catch(""),
  /** Human-readable price range, e.g. "$$$ · ~$120pp". */
  priceRange: z.string().catch(""),
  /** 1 (cheap) – 4 (very expensive). */
  priceLevel: z.coerce.number().int().min(1).max(4).catch(2),
  menuUrl: z.string().nullable().catch(null),
  /** Reservation/booking link (OpenTable, Resy, Tock, or the venue's own), or null. */
  bookingUrl: z.string().nullable().catch(null),
  summary: z.string().catch(""),
});
export type Restaurant = z.infer<typeof restaurantSchema>;

export const scoreCardSchema = z.object({
  restaurant: restaurantSchema,
  sources: z.array(sourceScoreSchema).catch([]),
  /** Per-criterion grades, one per criterion the user asked about. */
  criteria: z.array(criterionScoreSchema).catch([]),
  /** Confidence-weighted average of the per-source scores, 0–5 (recomputed server-side). */
  combinedScore: z.coerce.number().min(0).max(5).catch(0),
  /** Rounded combined score for the star row, 0–5 (recomputed server-side). */
  starRating: z.coerce.number().min(0).max(5).catch(0),
  verdict: z.string().catch(""),
});
export type ScoreCard = z.infer<typeof scoreCardSchema>;

/**
 * JSON Schema handed to Claude as the `submit_scorecard` tool input schema.
 * Kept in sync with the zod schemas above. Uses `additionalProperties: false`
 * and lists every key in `required` (with null unions for "absent" values) so
 * it satisfies strict tool use.
 */
export const scoreCardJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    restaurant: {
      type: "object",
      additionalProperties: false,
      properties: {
        name: { type: "string", description: "Official restaurant name." },
        location: {
          type: "string",
          description: "City and neighborhood/area, e.g. 'New York, NY (Greenwich Village)'.",
        },
        cuisine: { type: "string", description: "Primary cuisine / category." },
        priceRange: {
          type: "string",
          description: "Human-readable price range, e.g. '$$$ · ~$120 per person'.",
        },
        priceLevel: {
          type: "integer",
          enum: [1, 2, 3, 4],
          description: "1 = inexpensive, 4 = very expensive.",
        },
        menuUrl: {
          type: ["string", "null"],
          description: "URL to the menu if one can be found, otherwise null.",
        },
        bookingUrl: {
          type: ["string", "null"],
          description:
            "Reservation/booking link (OpenTable, Resy, Tock, SevenRooms, or the venue's own 'book a table' page) if one is found in the web results, otherwise null.",
        },
        summary: {
          type: "string",
          description: "1–2 sentence overview of the restaurant.",
        },
      },
      required: [
        "name",
        "location",
        "cuisine",
        "priceRange",
        "priceLevel",
        "menuUrl",
        "bookingUrl",
        "summary",
      ],
    },
    sources: {
      type: "array",
      description: "One entry per review source.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          source: {
            type: "string",
            description: "The source name, matching exactly one of the requested sources.",
          },
          score: {
            type: ["number", "null"],
            description: "Normalized 0–5 score, or null if no meaningful signal was found.",
          },
          nativeRating: {
            type: ["string", "null"],
            description: "The rating in its native form, e.g. '4.5/5 (1,203 reviews)' or '1 Star'. Null if none.",
          },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
          summary: { type: "string", description: "What reviewers/critics on this source say." },
          highlights: {
            type: "array",
            items: { type: "string" },
            description: "2–4 short bullet points.",
          },
          citations: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                title: { type: "string" },
                url: { type: "string" },
              },
              required: ["title", "url"],
            },
          },
        },
        required: ["source", "score", "nativeRating", "confidence", "summary", "highlights", "citations"],
      },
    },
    criteria: {
      type: "array",
      description:
        "One entry per criterion the user asked to be graded on. Empty array if none were requested.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: {
            type: "string",
            description: "The criterion name, matching exactly the one requested.",
          },
          score: {
            type: ["number", "null"],
            description:
              "Normalized 0–5 grade for this criterion derived from the substance of the reviews, or null if reviews say little about it.",
          },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
          summary: {
            type: "string",
            description: "1 sentence on what reviewers specifically say about this criterion.",
          },
        },
        required: ["name", "score", "confidence", "summary"],
      },
    },
    combinedScore: {
      type: "number",
      description: "Confidence-weighted average of the per-source scores, 0–5, one decimal.",
    },
    starRating: {
      type: "number",
      description: "Combined score rounded to the nearest half, 0–5.",
    },
    verdict: { type: "string", description: "One-line overall takeaway." },
  },
  required: ["restaurant", "sources", "criteria", "combinedScore", "starRating", "verdict"],
} as const;
