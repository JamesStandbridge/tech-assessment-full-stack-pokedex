import type { JSX } from "react";

interface BarProps {
  readonly label: string;
  readonly value: number;
  /** Length of the bar, from 0 to 1. */
  readonly share: number;
  readonly color: string;
}

/**
 * A labelled value drawn as a graduated bar; assistive technologies read it as a meter.
 * The bar grows with a CSS animation that reduced motion turns off.
 */
export function Bar({ label, value, share, color }: BarProps): JSX.Element {
  const clamped = Math.min(Math.max(share, 0), 1);
  const maximum = clamped > 0 ? Math.round(value / clamped) : value;
  return (
    <div className="grid grid-cols-[5.5rem_1fr_2.25rem] items-center gap-3">
      <span className="catalogue text-muted truncate">{label}</span>
      <div
        role="meter"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={Math.max(maximum, value)}
        className="graduated bg-panel-raised h-1.5 overflow-hidden"
      >
        <div
          className="motion-safe:animate-grow h-full origin-left"
          style={{ backgroundColor: color, transform: `scaleX(${String(clamped)})` }}
        />
      </div>
      <span className="text-right font-mono text-sm tabular-nums">{value}</span>
    </div>
  );
}
