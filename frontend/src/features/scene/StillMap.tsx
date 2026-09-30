import { type JSX, type RefObject, useEffect, useRef, useState } from "react";

import type { SceneFrame } from "../../domain/scene";
import type { SceneNode } from "../../domain/sceneTypes";
import { lookOf } from "./looks";
import { kindHex, weatherHex } from "./palette";
import type { Inset, Mark, Viewport } from "./protocol";
import { stillPositions, stillView, type StillView } from "./still";

interface StillMapProps {
  readonly frame: SceneFrame;
  readonly marks: readonly Mark[];
  readonly colors: ReadonlyMap<string, string>;
  readonly highlighted: ReadonlySet<string>;
  readonly inset: Inset;
  readonly onLabels: (positions: Float32Array) => void;
}

interface Drawing {
  readonly frame: SceneFrame;
  readonly view: StillView;
  readonly highlighted: ReadonlySet<string>;
}

const OPACITY: Readonly<Record<SceneNode["emphasis"], number>> = {
  idle: 0.85,
  lit: 1,
  front: 1,
  dim: 0.25,
};
const DOT_SHARE = 0.55;
const LINK_COLOR = "#9aa6c4";
const LIT_LINK_COLOR = "#ffd23f";

function useViewport(): {
  readonly ref: RefObject<SVGSVGElement | null>;
  readonly viewport: Viewport;
} {
  const ref = useRef<SVGSVGElement>(null);
  const [viewport, setViewport] = useState<Viewport>({ width: 1, height: 1, pixelRatio: 1 });
  useEffect(() => {
    const element = ref.current;
    if (element === null) return;
    const observer = new ResizeObserver(() => {
      const box = element.getBoundingClientRect();
      setViewport({
        width: Math.max(1, box.width),
        height: Math.max(1, box.height),
        pixelRatio: 1,
      });
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);
  return { ref, viewport };
}

function Guides({ frame, view }: Drawing): JSX.Element {
  const axis = frame.axis;
  const center = view.project(frame.camera.target);
  const from = axis === null ? null : view.project(axis.from);
  const to = axis === null ? null : view.project(axis.to);
  return (
    <g className="stroke-muted/40 fill-none">
      {from === null || to === null ? null : <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} />}
      {frame.rings.map((ring) => (
        <circle key={ring.name} cx={center.x} cy={center.y} r={view.radius(ring.radius * 2, 0)} />
      ))}
    </g>
  );
}

function Links({ frame, view, highlighted }: Drawing): JSX.Element {
  const at = new Map(frame.nodes.map((node) => [node.id, view.project(node.position)]));
  return (
    <g>
      {frame.links.map((link) => {
        const from = at.get(link.source);
        const to = at.get(link.target);
        if (from === undefined || to === undefined) return null;
        const lit = highlighted.has(link.source) && highlighted.has(link.target);
        return (
          <line
            key={`${link.source}>${link.target}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={lit ? LIT_LINK_COLOR : LINK_COLOR}
            strokeOpacity={0.2 + link.strength * 0.5}
          />
        );
      })}
    </g>
  );
}

function Stars(props: Drawing & { readonly colors: ReadonlyMap<string, string> }): JSX.Element {
  const { frame, view, highlighted, colors } = props;
  const colorOf = (node: SceneNode): string =>
    node.kind === "weather"
      ? weatherHex(frame.weather ?? "")
      : (colors.get(node.id) ?? kindHex(node.kind));
  return (
    <g>
      {frame.nodes.map((node) => {
        const place = view.project(node.position);
        const size = lookOf(node, highlighted.has(node.id)).size * DOT_SHARE;
        return (
          <circle
            key={node.id}
            cx={place.x}
            cy={place.y}
            r={Math.max(1, view.radius(size, node.position.z))}
            fill={colorOf(node)}
            fillOpacity={OPACITY[node.emphasis]}
          />
        );
      })}
    </g>
  );
}

/** The constellation as a still front view, for browsers and users the scene does not suit (SYS-UI-025). */
export function StillMap(props: StillMapProps): JSX.Element {
  const { frame, marks, colors, highlighted, inset, onLabels } = props;
  const { ref, viewport } = useViewport();
  const drawing = { frame, view: stillView(frame, { viewport, inset }), highlighted };
  useEffect(() => {
    onLabels(stillPositions(frame, marks, { viewport, inset }));
  }, [frame, marks, viewport, inset, onLabels]);
  return (
    <svg
      ref={ref}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
      viewBox={`0 0 ${String(viewport.width)} ${String(viewport.height)}`}
    >
      <Guides {...drawing} />
      <Links {...drawing} />
      <Stars {...drawing} colors={colors} />
    </svg>
  );
}
