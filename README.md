# Alexichelin

Type a restaurant, get a one-pager that combines its reputation across
**Reddit, Instagram, Google and Michelin** into a single score.

There are no per-service API keys or scrapers. The app gives Claude a live
**web search** tool and asks it to research each source, normalize every rating
to a 0–5 scale, and return a structured scorecard — which the UI renders as a
header (cuisine / price / menu), four source cards, a combined score, and a
5-star rating.

## How it works

```
Browser ──POST /api/assess──▶ lib/assess.ts ──▶ Claude (claude-opus-4-8)
                                                  ├─ web_search  (researches each source)
                                                  └─ submit_scorecard (strict schema → final answer)
        ◀──────────── ScoreCard JSON ────────────┘
```

The model runs several web-search rounds, then emits the result by calling the
`submit_scorecard` tool. Its input is validated with zod against the schema in
`lib/schema.ts` before it reaches the UI. Using a strict tool (rather than
`output_config.format`) keeps structured output compatible with web search's
citations.

## Setup

```bash
npm install
cp .env.example .env.local   # then add your ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000 and search a restaurant (add a city if the name is
common, e.g. `Carbone` + `New York`). A lookup takes ~20–40s while Claude
searches the sources.

Get an API key at https://console.anthropic.com/.

## Notes

- Scores are AI estimates from public web sources, not official ratings. When a
  source has little signal, that card shows "No strong signal found" and is
  down-weighted in the combined score.
- The serverless function is capped at 60s (`maxDuration` in
  `app/api/assess/route.ts`); lookups that need many search rounds run more
  comfortably in local `npm run dev`.
- Sources live in `SOURCES` in `lib/schema.ts` — adding a fifth (e.g. Yelp or
  TripAdvisor) is a one-line change there plus a mention in the prompt in
  `lib/assess.ts`.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · `@anthropic-ai/sdk` · zod.
