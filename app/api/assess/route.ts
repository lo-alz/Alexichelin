import { NextResponse } from "next/server";
import { z } from "zod";
import { assessRestaurant } from "@/lib/assess";

export const runtime = "nodejs";
// The Claude call does several web-search rounds; give it room.
export const maxDuration = 60;

const bodySchema = z.object({
  restaurant: z.string().min(1, "Enter a restaurant name.").max(200),
  location: z.string().max(200).optional(),
  criteria: z.array(z.string().min(1).max(60)).max(12).optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  try {
    const scorecard = await assessRestaurant(
      parsed.data.restaurant,
      parsed.data.location,
      parsed.data.criteria ?? [],
    );
    return NextResponse.json(scorecard);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    // Missing key is a config problem (500); everything else we treat as a 502
    // (upstream model/search issue) so the UI can show a friendly retry.
    const status = message.includes("OPENROUTER_API_KEY") ? 500 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
