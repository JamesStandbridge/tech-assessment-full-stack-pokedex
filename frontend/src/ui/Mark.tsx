import type { JSX } from "react";

const CENTER = 24;
const RIM = 21;
const TICK_STEP_DEG = 10;
const CARDINAL_DEG = 90;

function polar(radius: number, degrees: number): string {
  const angle = (degrees * Math.PI) / 180;
  const x = CENTER + Math.cos(angle) * radius;
  const y = CENTER + Math.sin(angle) * radius;
  return `${x.toFixed(2)} ${y.toFixed(2)}`;
}

const TICKS = Array.from({ length: 360 / TICK_STEP_DEG }, (_, index) => {
  const degrees = index * TICK_STEP_DEG;
  const inner = degrees % CARDINAL_DEG === 0 ? RIM - 3.5 : RIM - 1.5;
  return `M${polar(RIM, degrees)}L${polar(inner, degrees)}`;
}).join("");

const CONSTELLATION = "M12 20.5L17.5 13L26.5 10.5L34 15";

function sparkle(x: number, y: number, size: number): string {
  return `M${String(x)} ${String(y - size)}Q${String(x)} ${String(y)} ${String(x + size)} ${String(y)}Q${String(x)} ${String(y)} ${String(x)} ${String(y + size)}Q${String(x)} ${String(y)} ${String(x - size)} ${String(y)}Q${String(x)} ${String(y)} ${String(x)} ${String(y - size)}Z`;
}

/**
 * The atlas mark: an astrolabe ring, the split line of a Poké Ball drawn as a
 * tilted ecliptic through its button, and a constellation above it.
 */
export function Mark({ className }: { readonly className: string }): JSX.Element {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className={className} fill="none">
      <circle cx={CENTER} cy={CENTER} r={RIM} stroke="currentColor" strokeWidth="1.25" />
      <path d={TICKS} stroke="currentColor" strokeWidth="0.75" />
      <path
        d="M29.17 22.12L43.73 16.82M18.83 25.88L4.27 31.18"
        stroke="var(--color-accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx={CENTER} cy={CENTER} r="3.5" stroke="var(--color-accent)" strokeWidth="1.5" />
      <circle cx={CENTER} cy={CENTER} r="1" fill="var(--color-accent)" />
      <path d={CONSTELLATION} stroke="currentColor" strokeOpacity="0.55" strokeWidth="0.6" />
      <g fill="currentColor">
        <circle cx="12" cy="20.5" r="1.1" />
        <circle cx="17.5" cy="13" r="1.3" />
        <path d={sparkle(26.5, 10.5, 3.2)} />
        <circle cx="34" cy="15" r="1.1" />
        <circle cx="29" cy="33.5" r="0.8" />
      </g>
    </svg>
  );
}
