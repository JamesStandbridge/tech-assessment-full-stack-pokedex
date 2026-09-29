import type { JSX } from "react";

interface BarProps {
  readonly label: string;
  readonly value: number;
  /** Length of the bar, from 0 to 1. */
  readonly share: number;
  readonly color: string;
}

/**
 * A labelled value drawn as a bar; assistive technologies read it as a meter.
 * The bar grows with a CSS transition that reduced motion turns off.
 */
export function Bar({ label, value, share, color }: BarProps): JSX.Element {
  const clamped = Math.min(Math.max(share, 0), 1);
  const maximum = clamped > 0 ? Math.round(value / clamped) : value;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-muted w-20 shrink-0">{label}</span>
      <div
        role="meter"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={Math.max(maximum, value)}
        className="bg-panel-raised h-2.5 flex-1 overflow-hidden rounded-full"
      >
        <div
          className="h-full origin-left rounded-full motion-safe:animate-[grow_600ms_ease-out]"
          style={{ backgroundColor: color, transform: `scaleX(${String(clamped)})` }}
        />
      </div>
      <span className="w-10 text-right font-mono tabular-nums">{value}</span>
    </div>
  );
}
