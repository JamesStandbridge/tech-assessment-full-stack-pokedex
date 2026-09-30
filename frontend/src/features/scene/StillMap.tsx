import { type JSX, type RefObject, useEffect, useRef, useState } from "react";

import { assertNever } from "../../domain/assertNever";
import type { SceneFrame } from "../../domain/scene";
import { useTheme } from "../theme/useTheme";
import type { Gesture } from "./gestures";
import type { Inset, Mark, Viewport } from "./protocol";
import {
  panBy,
  type Pan,
  panned,
  stillPick,
  stillPositions,
  stillView,
  type StillView,
  zoomAt,
} from "./still";
import { StillDrawing } from "./StillDrawing";
import { cursorOf, useGestures } from "./useGestures";

interface StillMapProps {
  readonly frame: SceneFrame;
  readonly marks: readonly Mark[];
  readonly colors: ReadonlyMap<string, string>;
  /** Sprite of each Pokémon star, drawn instead of its dot. */
  readonly sprites: ReadonlyMap<string, string>;
  readonly highlighted: ReadonlySet<string>;
  readonly inset: Inset;
  /** How the user moved the map. */
  readonly pan: Pan;
  readonly hovered: string | null;
  readonly onLabels: (positions: Float32Array) => void;
  readonly onHover: (id: string | null) => void;
  readonly onPick: (id: string) => void;
  readonly onNavigate: (move: (pan: Pan) => Pan) => void;
}

function useViewport(): {
  readonly ref: RefObject<HTMLDivElement | null>;
  readonly viewport: Viewport;
} {
  const ref = useRef<HTMLDivElement>(null);
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

/** Any drag pans the map; the wheel and a pinch zoom it around the pointer. */
function follow(gesture: Gesture, props: StillMapProps, view: StillView): void {
  const pointed = (at: { readonly x: number; readonly y: number }): string | null =>
    stillPick(props.frame, panned(view, props.pan), { ...at, highlighted: props.highlighted });
  switch (gesture.type) {
    case "hover":
      props.onHover(pointed(gesture));
      return;
    case "leave":
      props.onHover(null);
      return;
    case "click": {
      const id = pointed(gesture);
      if (id !== null) props.onPick(id);
      return;
    }
    case "drag":
      props.onNavigate((pan) => panBy(pan, gesture));
      return;
    case "zoom":
      props.onNavigate((pan) => zoomAt(pan, gesture));
      return;
    default:
      assertNever(gesture);
  }
}

/** The constellation as a still front view, for browsers and users the scene does not suit (SYS-UI-025). */
export function StillMap(props: StillMapProps): JSX.Element {
  const { frame, marks, highlighted, inset, pan, hovered, onLabels } = props;
  const { ref, viewport } = useViewport();
  const { theme } = useTheme();
  const view = stillView(frame, { viewport, inset });
  useGestures(ref, (gesture) => {
    follow(gesture, props, view);
  });
  useEffect(() => {
    onLabels(stillPositions(frame, marks, { viewport, inset, pan, hovered }));
  }, [frame, marks, viewport, inset, pan, hovered, onLabels]);
  const transform = `translate(${String(pan.x)} ${String(pan.y)}) scale(${String(pan.scale)})`;
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`absolute inset-0 touch-none ${cursorOf(hovered !== null)}`}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${String(viewport.width)} ${String(viewport.height)}`}
      >
        <g transform={transform}>
          <StillDrawing
            frame={frame}
            view={view}
            highlighted={highlighted}
            theme={theme}
            colors={props.colors}
            sprites={props.sprites}
          />
        </g>
      </svg>
    </div>
  );
}
