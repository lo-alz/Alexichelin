import { callOpenRouter, MODEL } from "./openrouter";
import { scoreCardJsonSchema, scoreCardSchema, SOURCES, type ScoreCard } from "./schema";

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

function systemPrompt(): string {
  return `You are a restaurant review aggregator. Given a restaurant, you assess what each of these sources thinks of it and produce one combined scorecard: ${SOURCES.join(
    ", ",
  )}.

Method:
- Live web search results for the restaurant are provided to you. Ground your assessment in them — do not rely on prior knowledge for ratings, prices, or current status.
- For each source, find the rating/sentiment and capture it:
  - Google: the Google Maps star rating and review count.
  - Michelin: stars / Bib Gourmand / "Michelin Guide" listing, or note if not listed.
  - Reddit: overall sentiment across relevant threads (r/<city>, food subreddits).
  - Instagram: how it's portrayed/received (popularity, sentiment of comments, notable coverage).
- Normalize EVERY source to a 0–5 scale. Put the raw value in nativeRating (e.g. "4.5/5 (1,203 reviews)", "1 Michelin Star").
- Be honest about confidence. If a source has little or no signal, set score to null and confidence to "low" rather than inventing a number. Never fabricate ratings or citations — only include URLs that appear in the provided web results.
- Also capture basic facts: cuisine, price range + priceLevel (1–4), and a menu URL if one exists (else null).
- combinedScore = a confidence-weighted average of the non-null per-source scores (weight high=1.0, medium=0.6, low=0.3). starRating = combinedScore rounded to the nearest half.

Respond by calling the submit_scorecard function exactly once with the complete scorecard. Do not write a prose answer instead of calling the function.`;
}

function userPrompt(restaurant: string, location?: string): string {
  const where = location?.trim() ? ` Location/context: ${location.trim()}.` : "";
  return `Restaurant: ${restaurant.trim()}.${where}\n\nResearch all sources and submit the scorecard.`;
}

/**
 * Research a restaurant across all sources and return a validated scorecard.
 * Uses OpenRouter with its `web` plugin for live search, then forces a
 * submit_scorecard function call which we parse and validate against the schema.
 */
export async function assessRestaurant(
  restaurant: string,
  location?: string,
): Promise<ScoreCard> {
  const data = await callOpenRouter({
    model: MODEL,
    max_tokens: 16000,
    messages: [
      { role: "system", content: systemPrompt() },
      { role: "user", content: userPrompt(restaurant, location) },
    ],
    tools: [SUBMIT_TOOL],
    tool_choice: { type: "function", function: { name: "submit_scorecard" } },
    // OpenRouter web plugin: runs live searches and injects results into context.
    plugins: [{ id: "web", max_results: 5 }],
  });

  const toolCalls = data.choices?.[0]?.message?.tool_calls ?? [];
  const call =
    toolCalls.find((c) => c.function?.name === "submit_scorecard") ?? toolCalls[0];

  if (!call?.function?.arguments) {
    throw new Error(
      "Could not produce a scorecard for that restaurant — try a more specific name or add a location.",
    );
  }

  let raw: unknown;
  try {
    raw = JSON.parse(call.function.arguments);
  } catch {
    throw new Error("Model returned malformed JSON for the scorecard.");
  }

  const parsed = scoreCardSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Model returned a malformed scorecard: ${parsed.error.message}`);
  }
  return parsed.data;
}
