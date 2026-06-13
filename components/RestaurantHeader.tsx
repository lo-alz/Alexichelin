import type { Restaurant } from "@/lib/schema";

export default function RestaurantHeader({ restaurant }: { restaurant: Restaurant }) {
  return (
    <div className="text-center">
      <h2 className="font-display text-5xl font-semibold leading-tight sm:text-6xl">
        {restaurant.name}
      </h2>
      {restaurant.mapsUrl ? (
        <a
          href={restaurant.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block font-display text-xl italic text-muted underline decoration-line underline-offset-4 transition-colors hover:text-gold hover:decoration-gold"
        >
          {restaurant.location} ↗
        </a>
      ) : (
        <p className="mt-2 font-display text-xl italic text-muted">{restaurant.location}</p>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
        <Meta label="Cuisine" value={restaurant.cuisine} />
        <Divider />
        <Meta label="Price" value={restaurant.priceRange} />
        <Divider />
        <Meta label="Tier" value={"$".repeat(restaurant.priceLevel)} />
        {restaurant.menuUrl && (
          <>
            <Divider />
            <a
              href={restaurant.menuUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="label text-gold transition-colors hover:text-goldDark"
            >
              Menu ↗
            </a>
          </>
        )}
      </div>

      {restaurant.bookingUrl && (
        <div className="mt-7">
          <a
            href={restaurant.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="label inline-block border border-ink px-7 py-3 text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            Book a table ↗
          </a>
        </div>
      )}

      {restaurant.summary && (
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink/80">
          {restaurant.summary}
        </p>
      )}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-2">
      <span className="label">{label}</span>
      <span className="text-base text-ink">{value}</span>
    </span>
  );
}

function Divider() {
  return <span className="hidden h-4 w-px bg-line sm:inline-block" aria-hidden />;
}
