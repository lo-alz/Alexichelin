import type { SourceScore } from "./schema";

/** Domain fragment used to recognise a citation that belongs to the source. */
const DOMAIN_HINTS: Record<string, string> = {
  google: "google.",
  reddit: "reddit.com",
  instagram: "instagram.com",
  michelin: "michelin.com",
  tripadvisor: "tripadvisor.",
  yelp: "yelp.com",
  opentable: "opentable.",
  tiktok: "tiktok.com",
  facebook: "facebook.com",
  infatuation: "theinfatuation.com",
  eater: "eater.com",
};

/**
 * A link that opens the source for this restaurant. Prefers the actual page the
 * model cited; otherwise builds a search on that platform so there's always a
 * working "View on …" link.
 */
export function sourceUrl(source: SourceScore, restaurant: string, location: string): string {
  const key = source.source.toLowerCase();
  const hint = Object.entries(DOMAIN_HINTS).find(([k]) => key.includes(k))?.[1];
  if (hint) {
    const cited = source.citations.find((c) => c.url.toLowerCase().includes(hint));
    if (cited?.url) return cited.url;
  }

  const q = encodeURIComponent([restaurant, location].filter(Boolean).join(" "));
  const rOnly = encodeURIComponent(restaurant);
  const loc = encodeURIComponent(location);

  const builders: [string, string][] = [
    ["reddit", `https://www.reddit.com/search/?q=${q}`],
    ["instagram", `https://www.instagram.com/explore/search/keyword/?q=${q}`],
    ["michelin", `https://guide.michelin.com/en/search?q=${q}`],
    ["tripadvisor", `https://www.tripadvisor.com/Search?q=${q}`],
    ["yelp", `https://www.yelp.com/search?find_desc=${rOnly}&find_loc=${loc}`],
    ["opentable", `https://www.opentable.com/s?term=${rOnly}`],
    ["tiktok", `https://www.tiktok.com/search?q=${q}`],
    ["facebook", `https://www.facebook.com/search/top?q=${q}`],
    ["infatuation", `https://www.theinfatuation.com/search?q=${q}`],
    ["eater", `https://www.eater.com/search?q=${q}`],
    ["google", `https://www.google.com/search?q=${q}`],
  ];
  for (const [k, url] of builders) if (key.includes(k)) return url;

  // Generic fallback: a Google search scoped to the source name.
  return `https://www.google.com/search?q=${encodeURIComponent(
    [restaurant, location, source.source].filter(Boolean).join(" "),
  )}`;
}
