import type { Restaurant } from "@/lib/schema";

export default function RestaurantHeader({ restaurant }: { restaurant: Restaurant }) {
  return (
    <div className="border-b border-stone-200 pb-6">
      <h2 className="font-serif text-3xl font-bold sm:text-4xl">{restaurant.name}</h2>
      <p className="mt-1 text-stone-500">{restaurant.location}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Pill label="Cuisine" value={restaurant.cuisine} />
        <Pill label="Price" value={restaurant.priceRange} />
        <Pill label="Tier" value={"$".repeat(restaurant.priceLevel)} />
        {restaurant.menuUrl && (
          <a
            href={restaurant.menuUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1 text-sm font-medium text-cream hover:bg-stone-700"
          >
            View menu ↗
          </a>
        )}
      </div>

      {restaurant.summary && (
        <p className="mt-4 max-w-2xl text-stone-700">{restaurant.summary}</p>
      )}
    </div>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3 py-1 text-sm">
      <span className="text-stone-400">{label}</span>
      <span className="font-medium">{value}</span>
    </span>
  );
}
