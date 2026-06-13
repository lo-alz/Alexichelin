import { NextResponse } from "next/server";
import { getSuggestions } from "@/lib/places";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  if (q.trim().length < 3) return NextResponse.json({ suggestions: [] });
  try {
    const suggestions = await getSuggestions(q);
    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
