import { z } from "zod";

/**
 * The four review sources we aggregate. Adding a fifth (e.g. "Yelp" or
 * "TripAdvisor") is a one-line change here plus the prompt in lib/assess.ts.
 */
export const SOURCES = ["Reddit", "Instagram", "Google", "Michelin"] as const;
export type Source = (typeof SOURCES)[number];

export const citationSchema = z.object({
  title: z.string(),
  url: z.string(),
});

export const sourceScoreSchema = z.object({
  source: z.enum(SOURCES),
  /** Normalized 0–5 score, or null when no meaningful signal was found. */
  score: z.number().min(0).max(5).nullable(),
  /** Native rating as found, e.g. "4.5/5 (1,203 reviews)", "1 Star", or null. */
  nativeRating: z.string().nullable(),
  confidence: z.enum(["high", "medium", "low"]),
  summary: z.string(),
  highlights: z.array(z.string()),
  citations: z.array(citationSchema),
});
export type SourceScore = z.infer<typeof sourceScoreSchema>;

export const restaurantSchema = z.object({
  name: z.string(),
  location: z.string(),
  cuisine: z.string(),
  /** Human-readable price range, e.g. "$$$ · ~$120pp". */
  priceRange: z.string(),
  /** 1 (cheap) – 4 (very expensive). */
  priceLevel: z.number().int().min(1).max(4),
  menuUrl: z.string().nullable(),
  summary: z.string(),
});
export type Restaurant = z.infer<typeof restaurantSchema>;

export const scoreCardSchema = z.object({
  restaurant: restaurantSchema,
  sources: z.array(sourceScoreSchema),
  /** Confidence-weighted average of the per-source scores, 0–5. */
  combinedScore: z.number().min(0).max(5),
  /** Rounded combined score for the star row, 0–5. */
  starRating: z.number().min(0).max(5),
  verdict: z.string(),
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
        summary: {
          type: "string",
          description: "1–2 sentence overview of the restaurant.",
        },
      },
      required: ["name", "location", "cuisine", "priceRange", "priceLevel", "menuUrl", "summary"],
    },
    sources: {
      type: "array",
      description: "One entry per review source.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          source: { type: "string", enum: [...SOURCES] },
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
  required: ["restaurant", "sources", "combinedScore", "starRating", "verdict"],
} as const;
