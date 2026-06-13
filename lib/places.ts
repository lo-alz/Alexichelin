/**
 * Google Places lookup for authoritative Google Maps data (rating + review
 * count + price level + photos + maps link). Uses the Places API (New) Text
 * Search endpoint. Reads GOOGLE_PLACES_API_KEY; returns null when the key is
 * missing or nothing is found, so the caller can fall back to web search.
 */
const SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const MAX_PHOTOS = 6;

export interface GooglePlace {
  name: string;
  /** Raw Google rating, 0–5. */
  rating: number;
  reviewCount: number;
  /** Google price level 1–4, if known. */
  priceLevel: number | null;
  mapsUri: string | null;
  /** Public image URLs (lh3.googleusercontent.com) for a carousel. */
  photos: string[];
}

const PRICE_LEVEL_MAP: Record<string, number> = {
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

/** Resolve photo resource names to public image URLs (no API key in the URL). */
async function resolvePhotos(photoNames: string[], key: string): Promise<string[]> {
  const results = await Promise.all(
    photoNames.slice(0, MAX_PHOTOS).map(async (name) => {
      try {
        const res = await fetch(
          `https://places.googleapis.com/v1/${name}/media?maxWidthPx=1200&skipHttpRedirect=true`,
          { headers: { "X-Goog-Api-Key": key } },
        );
        if (!res.ok) return null;
        const data = (await res.json()) as { photoUri?: string };
        return data.photoUri ?? null;
      } catch {
        return null;
      }
    }),
  );
  return results.filter((u): u is string => !!u);
}

export interface PlaceSuggestion {
  /** Restaurant display name. */
  name: string;
  /** Best-guess city (locality), e.g. "Vancouver". */
  city: string;
  /** Full formatted address, shown as secondary text. */
  area: string;
}

interface AddressComponent {
  longText?: string;
  types?: string[];
}

function pickCity(components: AddressComponent[]): string {
  const byType = (t: string) => components.find((c) => (c.types ?? []).includes(t))?.longText;
  return (
    byType("locality") ||
    byType("postal_town") ||
    byType("administrative_area_level_2") ||
    byType("administrative_area_level_1") ||
    ""
  );
}

/** Restaurant typeahead suggestions with a resolved city for each. */
export async function getSuggestions(query: string): Promise<PlaceSuggestion[]> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key || query.trim().length < 3) return [];
  try {
    const res = await fetch(SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask":
          "places.displayName,places.formattedAddress,places.addressComponents",
      },
      body: JSON.stringify({ textQuery: query.trim(), maxResultCount: 5, includedType: "restaurant" }),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      places?: {
        displayName?: { text?: string };
        formattedAddress?: string;
        addressComponents?: AddressComponent[];
      }[];
    };
    return (data.places ?? [])
      .map((p) => ({
        name: p.displayName?.text ?? "",
        city: pickCity(p.addressComponents ?? []),
        area: p.formattedAddress ?? "",
      }))
      .filter((s) => s.name);
  } catch {
    return [];
  }
}

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
          "places.displayName,places.rating,places.userRatingCount,places.priceLevel,places.googleMapsUri,places.photos",
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
        photos?: { name?: string }[];
      }[];
    };
    const p = data.places?.[0];
    if (!p || typeof p.rating !== "number") return null;

    const photoNames = (p.photos ?? []).map((ph) => ph.name).filter((n): n is string => !!n);
    const photos = photoNames.length ? await resolvePhotos(photoNames, key) : [];

    return {
      name: p.displayName?.text ?? restaurant,
      rating: p.rating,
      reviewCount: p.userRatingCount ?? 0,
      priceLevel: p.priceLevel ? PRICE_LEVEL_MAP[p.priceLevel] ?? null : null,
      mapsUri: p.googleMapsUri ?? null,
      photos,
    };
  } catch {
    return null;
  }
}
