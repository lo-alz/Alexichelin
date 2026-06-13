"use client";

/** Map a 0–100 importance/weight to an editorial word label. */
export function weightLabel(n: number): string {
  if (n <= 0) return "Off";
  if (n <= 25) return "Low";
  if (n <= 60) return "Medium";
  if (n <= 90) return "High";
  return "Essential";
}

/**
 * Gold range slider used for criteria importance and source weights. The track
 * shows a gold fill up to the value over a warm unfilled groove (custom thumb
 * + track styled in globals.css under `.rosette-slider`).
 */
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
  const pct = Math.max(0, Math.min(100, value));
  const groove = disabled ? "#E3DCCE" : "#CBBFA6";
  const fillColor = disabled ? "#C8BD9E" : "#A8884E";

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
      className="rosette-slider w-full"
      style={{
        background: `linear-gradient(to right, ${fillColor} 0%, ${fillColor} ${pct}%, ${groove} ${pct}%, ${groove} 100%)`,
      }}
    />
  );
}
