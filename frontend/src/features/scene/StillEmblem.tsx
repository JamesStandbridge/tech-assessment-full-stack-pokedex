import type { JSX } from "react";

import type { Emblem } from "../../domain/sceneTypes";
import { EMBLEM_SIZE, emblemStrokes } from "./emblems";

interface StillEmblemProps {
  readonly emblem: Emblem;
  readonly at: { readonly x: number; readonly y: number };
  /** Side of the emblem square on screen. */
  readonly side: number;
  readonly color: string;
  readonly opacity: number;
  /** The blur filter of the halo, when the emblem is in front or pointed at. */
  readonly halo: string | null;
}

const HALO_RADIUS = 7.5;
const HALO_OPACITY = 0.35;
/** Blur of the halo, in the units of the emblem square. */
export const HALO_BLUR = 2;

function Halo({ filter, color }: { readonly filter: string; readonly color: string }): JSX.Element {
  const center = EMBLEM_SIZE / 2;
  return (
    <circle
      cx={center}
      cy={center}
      r={HALO_RADIUS}
      fill={color}
      fillOpacity={HALO_OPACITY}
      stroke="none"
      filter={`url(#${filter})`}
    />
  );
}

/** A move, ability or weather engraved in thin lines, as on a star atlas. */
export function StillEmblem({
  emblem,
  at,
  side,
  color,
  opacity,
  halo,
}: StillEmblemProps): JSX.Element {
  const scale = side / EMBLEM_SIZE;
  return (
    <g
      transform={`translate(${String(at.x - side / 2)} ${String(at.y - side / 2)}) scale(${String(scale)})`}
      stroke={color}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}
    >
      {halo === null ? null : <Halo filter={halo} color={color} />}
      {emblemStrokes(emblem).map((stroke) => (
        <path
          key={`${stroke.d}@${String(stroke.scale)}`}
          d={stroke.d}
          transform={`translate(${String(stroke.x)} ${String(stroke.y)}) scale(${String(stroke.scale)})`}
          strokeWidth={stroke.width}
        />
      ))}
    </g>
  );
}
