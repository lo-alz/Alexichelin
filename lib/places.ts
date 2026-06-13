/**
 * Google Places lookup for authoritative Google Maps data (rating + review
 * count + price level). Uses the Places API (New) Text Search endpoint. Reads
 * GOOGLE_PLACES_API_KEY; returns null when the key is missing or nothing is
 * found, so the caller can fall back to web search.
 */
const SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";

export interface GooglePlace {
  name: string;
  /** Raw Google rating, 0–5. */
  rating: number;
  reviewCount: number;
  /** Google price level 1–4, if known. */
  priceLevel: number | null;
  mapsUri: string | null;
}

const PRICE_LEVEL_MAP: Record<string, number> = {
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

export async function getGooglePlace(
  restaurant: string,
  location?: string,
): Promise<GooglePlace | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return null;

  const textQuery = location?.trim() ? `${restaurant.trim()}, ${location.trim()}` : restaurant.trim();

  try {
    const res = await fetch(SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask":
          "places.displayName,places.rating,places.userRatingCount,places.priceLevel,places.googleMapsUri",
      },
      body: JSON.stringify({ textQuery, maxResultCount: 1 }),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      places?: {
        displayName?: { text?: string };
        rating?: number;
        userRatingCount?: number;
        priceLevel?: string;
        googleMapsUri?: string;
      }[];
    };
    const p = data.places?.[0];
    if (!p || typeof p.rating !== "number") return null;

    return {
      name: p.displayName?.text ?? restaurant,
      rating: p.rating,
      reviewCount: p.userRatingCount ?? 0,
      priceLevel: p.priceLevel ? PRICE_LEVEL_MAP[p.priceLevel] ?? null : null,
      mapsUri: p.googleMapsUri ?? null,
    };
  } catch {
    return null;
  }
}
