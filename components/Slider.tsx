"use client";

/** Map a 0–100 importance/weight to an editorial word label. */
export function weightLabel(n: number): string {
  if (n <= 0) return "Off";
  if (n <= 25) return "Low";
  if (n <= 60) return "Medium";
  if (n <= 90) return "High";
  return "Essential";
}

/** A slim gold range slider used for both criteria importance and source weights. */
export default function Slider({
  value,
  onChange,
  disabled,
  ariaLabel,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  return (
    <input
      type="range"
      min={0}
      max={100}
      step={5}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      disabled={disabled}
      aria-label={ariaLabel}
      style={{ accentColor: "#A8884E" }}
      className="h-1 w-full cursor-pointer appearance-none rounded-full bg-line disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
}
