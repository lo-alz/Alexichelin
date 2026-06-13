/**
 * Thin OpenRouter client. We hit the OpenAI-compatible Chat Completions API
 * directly with fetch (rather than the OpenAI SDK) so we can pass OpenRouter's
 * `plugins` field for live web search. Reads OPENROUTER_API_KEY.
 */
const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

/** Override with OPENROUTER_MODEL if needed; defaults to Claude Opus 4.8 on OpenRouter. */
export const MODEL = process.env.OPENROUTER_MODEL ?? "anthropic/claude-opus-4.8";

export interface ToolCall {
  id?: string;
  type?: string;
  function?: { name?: string; arguments?: string };
}

interface OpenRouterResponse {
  choices?: { message?: { content?: string | null; tool_calls?: ToolCall[] } }[];
  error?: { message?: string };
}

/** POST a Chat Completions body to OpenRouter and return the parsed response. */
export async function callOpenRouter(body: Record<string, unknown>): Promise<OpenRouterResponse> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error(
      "OPENROUTER_API_KEY is not set. Copy .env.example to .env.local and add your key.",
    );
  }

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      // Optional attribution headers OpenRouter uses for its dashboard.
      "HTTP-Referer": "https://alexichelin.vercel.app",
      "X-Title": "Alexichelin",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${text}`);
  }

  const data = (await res.json()) as OpenRouterResponse;
  if (data.error?.message) {
    throw new Error(data.error.message);
  }
  return data;
}
