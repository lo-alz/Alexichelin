import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropic, MODEL } from "./anthropic";
import { scoreCardJsonSchema, scoreCardSchema, SOURCES, type ScoreCard } from "./schema";

const MAX_ITERATIONS = 8;

const SUBMIT_TOOL: Anthropic.Tool = {
  name: "submit_scorecard",
  description:
    "Submit the final aggregated restaurant scorecard. Call this exactly once, after you have researched every source.",
  // strict guarantees the model's input matches the schema exactly.
  input_schema: scoreCardJsonSchema as unknown as Anthropic.Tool.InputSchema,
  strict: true,
};

const WEB_SEARCH_TOOL: Anthropic.WebSearchTool20260209 = {
  type: "web_search_20260209",
  name: "web_search",
  max_uses: 12,
};

function systemPrompt(): string {
  return `You are a restaurant review aggregator. Given a restaurant, you research what each of these sources thinks of it and produce one combined scorecard: ${SOURCES.join(
    ", ",
  )}.

Method:
- Use the web_search tool to research the restaurant on EACH source separately. Search before answering — do not rely on prior knowledge for ratings, prices, or current status.
- For each source, find the rating/sentiment and capture it:
  - Google: the Google Maps star rating and review count.
  - Michelin: stars / Bib Gourmand / "Michelin Guide" listing, or note if not listed.
  - Reddit: overall sentiment across relevant threads (r/<city>, food subreddits).
  - Instagram: how it's portrayed/received (popularity, sentiment of comments, notable coverage).
- Normalize EVERY source to a 0–5 scale. Put the raw value in nativeRating (e.g. "4.5/5 (1,203 reviews)", "1 Michelin Star").
- Be honest about confidence. If a source has little or no signal, set score to null and confidence to "low" rather than inventing a number. Never fabricate ratings or citations — only include URLs you actually found.
- Also capture basic facts: cuisine, price range + priceLevel (1–4), and a menu URL if one exists (else null).
- combinedScore = a confidence-weighted average of the non-null per-source scores (weight high=1.0, medium=0.6, low=0.3). starRating = combinedScore rounded to the nearest half.

When you have researched all sources, call submit_scorecard exactly once with the complete scorecard. Do not write a prose answer instead of calling the tool.`;
}

function userPrompt(restaurant: string, location?: string): string {
  const where = location?.trim() ? ` Location/context: ${location.trim()}.` : "";
  return `Restaurant: ${restaurant.trim()}.${where}\n\nResearch all sources and submit the scorecard.`;
}

/** Pull the submit_scorecard tool call out of a response, if present. */
function findScorecard(content: Anthropic.ContentBlock[]): unknown | null {
  for (const block of content) {
    if (block.type === "tool_use" && block.name === "submit_scorecard") {
      return block.input;
    }
  }
  return null;
}

/**
 * Research a restaurant across all sources and return a validated scorecard.
 * Runs a manual agentic loop: Claude does server-side web search rounds, then
 * emits the result via the submit_scorecard tool, which we parse and validate.
 */
export async function assessRestaurant(
  restaurant: string,
  location?: string,
): Promise<ScoreCard> {
  const client = getAnthropic();
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userPrompt(restaurant, location) },
  ];

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: systemPrompt(),
      tools: [WEB_SEARCH_TOOL, SUBMIT_TOOL],
      messages,
    });

    const raw = findScorecard(response.content);
    if (raw !== null) {
      const parsed = scoreCardSchema.safeParse(raw);
      if (!parsed.success) {
        throw new Error(`Model returned a malformed scorecard: ${parsed.error.message}`);
      }
      return parsed.data;
    }

    // Preserve the assistant turn (server tool_use / results live here).
    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "pause_turn") {
      // Server-side web search hit its per-turn limit — re-send to resume.
      continue;
    }

    if (response.stop_reason === "end_turn") {
      // Model stopped without submitting — nudge it once to call the tool.
      messages.push({
        role: "user",
        content: "Please finish by calling the submit_scorecard tool with the full scorecard.",
      });
      continue;
    }
  }

  throw new Error(
    "Could not produce a scorecard for that restaurant — try a more specific name or add a location.",
  );
}
