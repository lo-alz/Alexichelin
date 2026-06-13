import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

/** Lazily construct a single shared Anthropic client (reads ANTHROPIC_API_KEY). */
export function getAnthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Copy .env.example to .env.local and add your key.",
    );
  }
  if (!client) {
    client = new Anthropic();
  }
  return client;
}

export const MODEL = "claude-opus-4-8";
