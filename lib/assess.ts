import { callOpenRouter, MODEL } from "./openrouter";
import { getGooglePlace, type GooglePlace } from "./places";
import { roundToHalf, weightedSourceScore } from "./scoring";
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

function systemPrompt(criteria: string[], sources: string[]): string {
  const criteriaBlock =
    criteria.length > 0
      ? `

Personalized criteria — the user specifically cares about: ${criteria.join(", ")}.
- For EACH criterion, read what reviewers across ALL sources actually say about that aspect and grade it 0–5 from the substance of their comments — do NOT just copy the overall star rating. A place can have excellent food (4.7) but mediocre service (2.5) or poor accessibility (2.0).
- If the reviews say little about a criterion, set its score to null and confidence "low" rather than guessing. Give a 1-sentence summary of what reviewers actually said about it.
- Return exactly one entry per requested criterion in the "criteria" array, with "name" matching the requested wording.`
      : `

No personalized criteria were requested — return an empty "criteria" array.`;

  return `You are a restaurant review aggregator. Assess what each requested source thinks of the restaurant and produce one combined scorecard for these sources: ${sources.join(
    ", ",
  )}.

Method:
- Live web search results for the restaurant are provided to you. Ground your assessment in them — do not rely on prior knowledge for ratings, prices, or current status.
- For EACH requested source, find its rating/sentiment and capture it. Guidance for common sources:
  - Google / Google Maps: the star rating and review count. If "Verified Google Maps data" is provided below, use it verbatim.
  - Michelin: stars / Bib Gourmand / "Michelin Guide" listing, or note if not listed.
  - Reddit: overall sentiment across relevant threads (r/<city>, food subreddits).
  - Instagram / TikTok: how it's portrayed/received (popularity, sentiment of comments, notable coverage).
  - TripAdvisor / Yelp / OpenTable: that platform's star rating + review count.
  - The Infatuation / Eater / food blogs: the critic's verdict or notable mentions.
- Return exactly one entry per requested source, using the EXACT source name given above. Do NOT add any source that was not requested.
- Normalize EVERY source to a 0–5 scale. Put the raw value in nativeRating (e.g. "4.5/5 (1,203 reviews)", "1 Michelin Star").
- Be honest about confidence. If a source has little or no signal, set score to null and confidence to "low" rather than inventing a number. Never fabricate ratings or citations — only include URLs that appear in the provided web results.
- Also capture basic facts: cuisine, price range + priceLevel (1–4), a menu URL if one exists (else null), and a reservation/booking link in bookingUrl (OpenTable, Resy, Tock, SevenRooms, or the venue's own "book a table" page) when one appears in the results — else null. Only use a URL you actually see in the web results.
- combinedScore and starRating: provide your best estimate; they are recomputed server-side regardless.${criteriaBlock}

Respond by calling the submit_scorecard function exactly once with the complete scorecard. Do not write a prose answer instead of calling the function.`;
}

function userPrompt(
  restaurant: string,
  location: string | undefined,
  criteria: string[],
  sources: string[],
  place: GooglePlace | null,
): string {
  const where = location?.trim() ? ` Location/context: ${location.trim()}.` : "";
  const sourcesLine = `\nSources to assess: ${sources.join(", ")}.`;
  const criteriaLine =
    criteria.length > 0 ? `\nGrade these criteria: ${criteria.join(", ")}.` : "";
  let verified = "";
  if (place) {
    const price = place.priceLevel ? `, price level ${place.priceLevel}` : "";
    verified = `\n\nVerified Google Maps data (authoritative — use this exact rating for the Google source): ${place.rating}/5 from ${place.reviewCount.toLocaleString()} reviews${price}.${
      place.mapsUri ? ` Maps: ${place.mapsUri}` : ""
    }`;
  }
  return `Restaurant: ${restaurant.trim()}.${where}${sourcesLine}${criteriaLine}${verified}\n\nResearch all sources and submit the scorecard.`;
}

/**
 * Best-effort recovery of the JSON object from messy model output. Smaller
 * models (Haiku) sometimes leak tool-wrapper tags like `</parameter></invoke>`
 * where the closing braces should be. We cut at the first such tag, then walk
 * the object tracking string state and auto-close any braces/brackets left open
 * by truncation — which recovers an otherwise-complete scorecard.
 */
function salvageJson(input: string): string | null {
  let s = input;
  const tag = s.search(/<\/?(?:parameter|invoke|function|tool|antml)\b/i);
  if (tag >= 0) s = s.slice(0, tag);
  const start = s.indexOf("{");
  if (start < 0) return null;

  const stack: string[] = [];
  let inStr = false;
  let esc = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === "{") stack.push("}");
    else if (ch === "[") stack.push("]");
    else if (ch === "}" || ch === "]") {
      stack.pop();
      if (stack.length === 0) return s.slice(start, i + 1);
    }
  }
  // Truncated mid-object: close the open string (if any), drop a dangling
  // comma/partial key, and close every still-open brace/bracket.
  let out = s.slice(start);
  if (inStr) out += '"';
  out = out.replace(/,\s*$/, "").replace(/,\s*"[^"]*$/, "");
  while (stack.length) out += stack.pop();
  return out;
}

/**
 * Parse the tool-call arguments into JSON, tolerating markdown ```json fences,
 * surrounding prose, and leaked tool-wrapper tags. Throws with a diagnostic
 * snippet if every strategy fails.
 */
function parseToolJson(rawArgs: string): unknown {
  const stripped = rawArgs
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const attempts: (string | null)[] = [rawArgs, stripped, salvageJson(rawArgs)];

  for (const candidate of attempts) {
    if (!candidate) continue;
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

/** Loose match so "Google", "Google Maps", "google reviews" all resolve. */
function matchesRequested(name: string, requested: string[]): string | null {
  const n = name.trim().toLowerCase();
  for (const r of requested) {
    const rl = r.toLowerCase();
    if (n === rl || n.includes(rl) || rl.includes(n)) return r;
  }
  return null;
}

/**
 * Keep only the sources the user actually requested (mapping loose names back to
 * the requested spelling), drop duplicates, and discard anything the model
 * invented. This keeps the card from hard-failing on stray sources.
 */
function sanitizeScorecard(raw: unknown, requested: string[]): unknown {
  if (raw && typeof raw === "object" && Array.isArray((raw as { sources?: unknown }).sources)) {
    const seen = new Set<string>();
    const obj = raw as { sources: { source?: unknown }[] };
    obj.sources = obj.sources.filter((s) => {
      const name = typeof s?.source === "string" ? s.source : "";
      const canonical = matchesRequested(name, requested);
      if (!canonical || seen.has(canonical)) return false;
      s.source = canonical;
      seen.add(canonical);
      return true;
    });
  }
  return raw;
}

/** Overwrite the Google source with authoritative Places data when we have it. */
function applyGooglePlace(card: ScoreCard, place: GooglePlace): ScoreCard {
  const nativeRating = `${place.rating}/5 (${place.reviewCount.toLocaleString()} reviews)`;
  const existing = card.sources.find((s) => /google/i.test(s.source));
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
  sources: string[] = [...SOURCES],
): Promise<ScoreCard> {
  const sourceList = sources.length > 0 ? sources : [...SOURCES];
  // Authoritative Google data only when a Google-ish source is requested.
  const wantsGoogle = sourceList.some((s) => /google/i.test(s));
  const place = wantsGoogle ? await getGooglePlace(restaurant, location) : null;

  const data = await callOpenRouter({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [
      { role: "system", content: systemPrompt(criteria, sourceList) },
      { role: "user", content: userPrompt(restaurant, location, criteria, sourceList, place) },
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

  const raw = sanitizeScorecard(parseToolJson(call.function.arguments), sourceList);

  const parsed = scoreCardSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Model returned a malformed scorecard: ${parsed.error.message}`);
  }

  const card = place ? applyGooglePlace(parsed.data, place) : parsed.data;

  // Compute the source consensus ourselves rather than trusting the model's
  // (often flaky) numbers — confidence-weighted, equal user weight.
  const equalWeights = Object.fromEntries(card.sources.map((s) => [s.source, 50]));
  const consensus = weightedSourceScore(card.sources, equalWeights);
  card.combinedScore = consensus ?? 0;
  card.starRating = roundToHalf(card.combinedScore);

  return card;
}
