import { callOpenRouter, MODEL } from "./openrouter";
import { getGooglePlace, type GooglePlace } from "./places";
import { scoreCardJsonSchema, scoreCardSchema, SOURCES, type ScoreCard } from "./schema";

/** Completion budget. Override with OPENROUTER_MAX_TOKENS (e.g. to fit a small balance). */
const MAX_TOKENS = Number(process.env.OPENROUTER_MAX_TOKENS) || 16000;
/** Number of live web-search results to inject. Override with OPENROUTER_WEB_RESULTS. */
const WEB_RESULTS = Number(process.env.OPENROUTER_WEB_RESULTS) || 5;

/** OpenRouter (OpenAI-style) function tool used to get structured output back. */
const SUBMIT_TOOL = {
  type: "function",
  function: {
    name: "submit_scorecard",
    description:
      "Submit the final aggregated restaurant scorecard. Call this exactly once, after considering every source.",
    parameters: scoreCardJsonSchema,
  },
};

function systemPrompt(criteria: string[]): string {
  const criteriaBlock =
    criteria.length > 0
      ? `

Personalized criteria — the user specifically cares about: ${criteria.join(", ")}.
- For EACH criterion, read what reviewers across ALL sources actually say about that aspect and grade it 0–5 from the substance of their comments — do NOT just copy the overall star rating. A place can have excellent food (4.7) but mediocre service (2.5) or poor accessibility (2.0).
- If the reviews say little about a criterion, set its score to null and confidence "low" rather than guessing. Give a 1-sentence summary of what reviewers actually said about it.
- Return exactly one entry per requested criterion in the "criteria" array, with "name" matching the requested wording.`
      : `

No personalized criteria were requested — return an empty "criteria" array.`;

  return `You are a restaurant review aggregator. Given a restaurant, you assess what each of these sources thinks of it and produce one combined scorecard: ${SOURCES.join(
    ", ",
  )}.

Method:
- Live web search results for the restaurant are provided to you. Ground your assessment in them — do not rely on prior knowledge for ratings, prices, or current status.
- For each source, find the rating/sentiment and capture it:
  - Google: the Google Maps star rating and review count. If "Verified Google Maps data" is provided below, use it verbatim as the Google source rating.
  - Michelin: stars / Bib Gourmand / "Michelin Guide" listing, or note if not listed.
  - Reddit: overall sentiment across relevant threads (r/<city>, food subreddits).
  - Instagram: how it's portrayed/received (popularity, sentiment of comments, notable coverage).
- Normalize EVERY source to a 0–5 scale. Put the raw value in nativeRating (e.g. "4.5/5 (1,203 reviews)", "1 Michelin Star").
- Be honest about confidence. If a source has little or no signal, set score to null and confidence to "low" rather than inventing a number. Never fabricate ratings or citations — only include URLs that appear in the provided web results.
- Also capture basic facts: cuisine, price range + priceLevel (1–4), and a menu URL if one exists (else null).
- combinedScore = a confidence-weighted average of the non-null per-source scores (weight high=1.0, medium=0.6, low=0.3). starRating = combinedScore rounded to the nearest half.${criteriaBlock}

Respond by calling the submit_scorecard function exactly once with the complete scorecard. Do not write a prose answer instead of calling the function.`;
}

function userPrompt(
  restaurant: string,
  location: string | undefined,
  criteria: string[],
  place: GooglePlace | null,
): string {
  const where = location?.trim() ? ` Location/context: ${location.trim()}.` : "";
  const criteriaLine =
    criteria.length > 0 ? `\nGrade these criteria: ${criteria.join(", ")}.` : "";
  let verified = "";
  if (place) {
    const price = place.priceLevel ? `, price level ${place.priceLevel}` : "";
    verified = `\n\nVerified Google Maps data (authoritative — use this exact rating for the Google source): ${place.rating}/5 from ${place.reviewCount.toLocaleString()} reviews${price}.${
      place.mapsUri ? ` Maps: ${place.mapsUri}` : ""
    }`;
  }
  return `Restaurant: ${restaurant.trim()}.${where}${criteriaLine}${verified}\n\nResearch all sources and submit the scorecard.`;
}

/**
 * Parse the tool-call arguments into JSON, tolerating the ways smaller models
 * mangle it: markdown ```json fences, leading/trailing prose, or text wrapped
 * around the object. Throws with a diagnostic snippet if it still can't parse.
 */
function parseToolJson(rawArgs: string): unknown {
  const attempts: string[] = [rawArgs];
  const stripped = rawArgs
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  attempts.push(stripped);
  const first = stripped.indexOf("{");
  const last = stripped.lastIndexOf("}");
  if (first >= 0 && last > first) attempts.push(stripped.slice(first, last + 1));

  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate);
    } catch {
      // try the next repair strategy
    }
  }
  throw new Error(
    `Model returned malformed JSON (len=${rawArgs.length}). Head: ${rawArgs.slice(
      0,
      160,
    )} … Tail: ${rawArgs.slice(-160)}`,
  );
}

/** Overwrite the Google source with authoritative Places data when we have it. */
function applyGooglePlace(card: ScoreCard, place: GooglePlace): ScoreCard {
  const nativeRating = `${place.rating}/5 (${place.reviewCount.toLocaleString()} reviews)`;
  const existing = card.sources.find((s) => s.source === "Google");
  if (existing) {
    existing.score = place.rating;
    existing.nativeRating = nativeRating;
    existing.confidence = "high";
    if (place.mapsUri && !existing.citations.some((c) => c.url === place.mapsUri)) {
      existing.citations.unshift({ title: "Google Maps", url: place.mapsUri });
    }
  } else {
    card.sources.push({
      source: "Google",
      score: place.rating,
      nativeRating,
      confidence: "high",
      summary: `Rated ${place.rating}/5 across ${place.reviewCount.toLocaleString()} Google reviews.`,
      highlights: [],
      citations: place.mapsUri ? [{ title: "Google Maps", url: place.mapsUri }] : [],
    });
  }
  if (place.priceLevel) card.restaurant.priceLevel = place.priceLevel;
  return card;
}

/**
 * Research a restaurant across all sources and return a validated scorecard.
 * Pulls authoritative Google Maps data via the Places API (when configured),
 * then uses OpenRouter with its `web` plugin for live search and forces a
 * submit_scorecard function call which we parse and validate.
 */
export async function assessRestaurant(
  restaurant: string,
  location?: string,
  criteria: string[] = [],
): Promise<ScoreCard> {
  // Authoritative Google data (null if no key / not found) — runs alongside the model call.
  const place = await getGooglePlace(restaurant, location);

  const data = await callOpenRouter({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [
      { role: "system", content: systemPrompt(criteria) },
      { role: "user", content: userPrompt(restaurant, location, criteria, place) },
    ],
    tools: [SUBMIT_TOOL],
    tool_choice: { type: "function", function: { name: "submit_scorecard" } },
    // OpenRouter web plugin: runs live searches and injects results into context.
    plugins: [{ id: "web", max_results: WEB_RESULTS }],
  });

  const toolCalls = data.choices?.[0]?.message?.tool_calls ?? [];
  const call =
    toolCalls.find((c) => c.function?.name === "submit_scorecard") ?? toolCalls[0];

  if (!call?.function?.arguments) {
    throw new Error(
      "Could not produce a scorecard for that restaurant — try a more specific name or add a location.",
    );
  }

  const raw = parseToolJson(call.function.arguments);

  const parsed = scoreCardSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Model returned a malformed scorecard: ${parsed.error.message}`);
  }

  return place ? applyGooglePlace(parsed.data, place) : parsed.data;
}
