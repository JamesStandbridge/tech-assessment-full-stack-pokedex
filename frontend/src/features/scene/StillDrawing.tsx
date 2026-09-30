import { type JSX, useId } from "react";

import type { SceneFrame } from "../../domain/scene";
import type { SceneNode } from "../../domain/sceneTypes";
import type { Theme } from "../../domain/theme";
import { lookOf } from "./looks";
import { emblemHex, printedHex } from "./palette";
import type { StillView } from "./still";
import { HALO_BLUR, StillEmblem } from "./StillEmblem";

interface Drawing {
  readonly frame: SceneFrame;
  readonly view: StillView;
  readonly highlighted: ReadonlySet<string>;
  readonly theme: Theme;
}

interface StillDrawingProps extends Drawing {
  readonly colors: ReadonlyMap<string, string>;
  /** Sprite of each Pokémon star, drawn instead of its dot. */
  readonly sprites: ReadonlyMap<string, string>;
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

function Guides({ frame, view }: Drawing): JSX.Element {
  const axis = frame.axis;
  const center = view.project(frame.camera.target);
  const from = axis === null ? null : view.project(axis.from);
  const to = axis === null ? null : view.project(axis.to);
  return (
    <g className="stroke-muted/40 fill-none">
      {from === null || to === null ? null : (
        <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} vectorEffect="non-scaling-stroke" />
      )}
      {frame.rings.map((ring) => (
        <circle
          key={ring.name}
          cx={center.x}
          cy={center.y}
          r={view.radius(ring.radius * 2, 0)}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </g>
  );
}

function Links({ frame, view, highlighted, theme }: Drawing): JSX.Element {
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
            stroke={printedHex(lit ? LIT_LINK_COLOR : LINK_COLOR, theme)}
            strokeOpacity={0.2 + link.strength * 0.5}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </g>
  );
}

/** Share of a star's quad its sprite covers, as in the scene. */
const SPRITE_SHARE = 0.6;
const MIN_SPRITE = 10;

interface StarProps {
  readonly node: SceneNode;
  readonly at: { readonly x: number; readonly y: number };
  /** Screen radius of the star's quad. */
  readonly radius: number;
  readonly color: string;
  readonly sprite: string | undefined;
  readonly halo: string | null;
}

function Star({ node, at, radius, color, sprite, halo }: StarProps): JSX.Element {
  const side = Math.max(MIN_SPRITE, radius * 2 * SPRITE_SHARE);
  if (node.emblem !== null && node.emphasis !== "dim") {
    return (
      <StillEmblem
        emblem={node.emblem}
        at={at}
        side={side}
        color={color}
        opacity={OPACITY[node.emphasis]}
        halo={halo}
      />
    );
  }
  if (sprite === undefined) {
    return (
      <circle
        cx={at.x}
        cy={at.y}
        r={Math.max(1, radius * DOT_SHARE)}
        fill={color}
        fillOpacity={OPACITY[node.emphasis]}
      />
    );
  }
  return (
    <image
      href={sprite}
      x={at.x - side / 2}
      y={at.y - side / 2}
      width={side}
      height={side}
      opacity={OPACITY[node.emphasis]}
      className="[image-rendering:pixelated]"
    />
  );
}

function Stars(props: StillDrawingProps): JSX.Element {
  const { frame, view, highlighted, colors, sprites, theme } = props;
  const haloId = `halo${useId().replace(/[^\w-]/g, "")}`;
  const colorOf = (node: SceneNode): string =>
    printedHex(colors.get(node.id) ?? emblemHex(node), theme);
  const haloOf = (node: SceneNode): string | null =>
    node.emphasis === "front" || highlighted.has(node.id) ? haloId : null;
  return (
    <g>
      <filter id={haloId} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation={HALO_BLUR} />
      </filter>
      {frame.nodes.map((node) => (
        <Star
          key={node.id}
          node={node}
          at={view.project(node.position)}
          radius={view.radius(lookOf(node, highlighted.has(node.id)).size, node.position.z)}
          color={colorOf(node)}
          sprite={sprites.get(node.id)}
          halo={haloOf(node)}
        />
      ))}
    </g>
  );
}

/** The guides, links and stars of the still map, in its unmoved view. */
export function StillDrawing(props: StillDrawingProps): JSX.Element {
  return (
    <>
      <Guides {...props} />
      <Links {...props} />
      <Stars {...props} />
    </>
  );
}
