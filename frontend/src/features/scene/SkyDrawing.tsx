import type { JSX } from "react";

import type { Species } from "../../api/contract";
import type { SceneNode } from "../../domain/sceneTypes";
import { ConstellationCanvas } from "./ConstellationCanvas";
import { typeHex } from "./palette";
import { StillMap } from "./StillMap";
import type { Renderer } from "./support";
import type { Sky } from "./useSky";

function colorsOf(species: readonly Species[]): ReadonlyMap<string, string> {
  return new Map(species.map((one) => [`pokemon:${one.name}`, typeHex(one.types[0] ?? "normal")]));
}

function spritesOf(species: readonly Species[]): ReadonlyMap<string, string> {
  return new Map(
    species.flatMap((one) =>
      one.sprite_url === null ? [] : [[`pokemon:${one.name}`, one.sprite_url] as const],
    ),
  );
}

function picker(sky: Sky, onPick: (node: SceneNode) => void): (id: string) => void {
  return (id) => {
    const node = sky.nodeOf(id);
    if (node !== undefined) onPick(node);
  };
}

interface SkyDrawingProps {
  readonly species: readonly Species[];
  readonly sky: Sky;
  readonly renderer: Renderer;
  readonly onLabels: (positions: Float32Array) => void;
  readonly onPick: (node: SceneNode) => void;
  readonly onFallback: () => void;
}

/** The sky drawn by the chosen renderer, which both report hovers, picks and moves of the view. */
export function SkyDrawing(props: SkyDrawingProps): JSX.Element {
  const { species, sky, renderer, onLabels } = props;
  const common = {
    frame: sky.frame,
    marks: sky.marks,
    inset: sky.inset,
    onLabels,
    onHover: sky.hover,
    onPick: picker(sky, props.onPick),
  };
  if (renderer === "still") {
    return (
      <StillMap
        {...common}
        colors={colorsOf(species)}
        sprites={spritesOf(species)}
        highlighted={sky.highlighted}
        pan={sky.navigation.pan}
        hovered={sky.hovered?.id ?? null}
        onNavigate={sky.navigation.navigate}
      />
    );
  }
  return (
    <ConstellationCanvas
      {...common}
      species={species}
      highlighted={[...sky.highlighted]}
      moved={sky.navigation.moved}
      hovering={sky.hovered !== null}
      onNavigate={sky.navigation.touch}
      onFallback={props.onFallback}
    />
  );
}
