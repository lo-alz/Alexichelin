"use client";

/**
 * Touch-friendly horizontal image carousel (scroll-snap). Mobile-first: swipe
 * on a phone, arrow-key/trackpad on desktop. Bleeds to the screen edges.
 */
export default function ImageCarousel({ images, alt }: { images: string[]; alt: string }) {
  if (!images.length) return null;
  return (
    <div className="-mx-6 overflow-x-auto px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex snap-x snap-mandatory gap-3">
        {images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={src}
            alt={`${alt} — photo ${i + 1}`}
            loading="lazy"
            className="h-52 w-[78%] shrink-0 snap-center rounded object-cover sm:h-72 sm:w-[60%]"
          />
        ))}
      </div>
    </div>
  );
}
