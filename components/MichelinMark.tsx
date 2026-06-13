import type { MichelinDistinction } from "@/lib/michelin";

const RED = "#BA0C2F";

function Star({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={RED} aria-hidden>
      <path d="M12 2l2.94 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 7.06-1.01z" />
    </svg>
  );
}

/** Friendly Bibendum-style face for the Bib Gourmand. */
function BibFace({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="10" fill={RED} />
      <circle cx="9" cy="10" r="1.4" fill="#fff" />
      <circle cx="15" cy="10" r="1.4" fill="#fff" />
      <path d="M8 14 Q12 17 16 14" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function Plate({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="9" fill="none" stroke={RED} strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.5" fill="none" stroke={RED} strokeWidth="1.1" />
    </svg>
  );
}

/** The native Michelin distinction, shown prominently on the Michelin card. */
export default function MichelinMark({ d }: { d: MichelinDistinction }) {
  if (d.kind === "star") {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex gap-0.5">
          {Array.from({ length: d.stars }).map((_, i) => (
            <Star key={i} />
          ))}
        </div>
        <span className="label !text-[0.6rem]" style={{ color: RED }}>
          {d.label}
        </span>
      </div>
    );
  }
  if (d.kind === "bib") {
    return (
      <div className="flex items-center gap-2">
        <BibFace />
        <span className="label !text-[0.6rem]" style={{ color: RED }}>
          Bib Gourmand
        </span>
      </div>
    );
  }
  if (d.kind === "plate") {
    return (
      <div className="flex items-center gap-2">
        <Plate />
        <span className="label !text-[0.6rem]" style={{ color: RED }}>
          {d.label}
        </span>
      </div>
    );
  }
  return <span className="font-display text-base italic text-muted">{d.label}</span>;
}
