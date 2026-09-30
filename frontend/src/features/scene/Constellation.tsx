import { type JSX, useRef } from "react";

import type { EntityRef, SearchResponse, Species } from "../../api/contract";
import { linkLabel, namedNodes, type SceneFrame } from "../../domain/scene";
import type { SceneNode } from "../../domain/sceneTypes";
import { Recenter } from "./Recenter";
import { placeLabels, SceneLabels } from "./SceneLabels";
import { SkyDrawing } from "./SkyDrawing";
import type { Renderer } from "./support";
import { useRenderer } from "./useRenderer";
import { useSky } from "./useSky";
import { useSpecies } from "./useSpecies";

interface ConstellationProps {
  readonly response: SearchResponse | null;
  /** Open the details of an entity. */
  readonly onOpen: (ref: EntityRef) => void;
  /** Look a species up, from the home sky. */
  readonly onRun: (query: string) => void;
  /** Whether the results panel covers part of the sky. */
  readonly panel: boolean;
  /** Whether the party or the bench covers part of the sky. */
  readonly workbench: boolean;
}

function Relations({ frame }: { readonly frame: SceneFrame }): JSX.Element {
  return (
    <figcaption className="sr-only">
      <ul aria-label="Relations">
        {frame.links.map((link) => (
          <li key={`${link.source}>${link.target}`}>{linkLabel(frame, link)}</li>
        ))}
      </ul>
    </figcaption>
  );
}

function dataOf(
  frame: SceneFrame,
  renderer: Renderer,
  species: number,
): Readonly<Record<string, string | undefined>> {
  return {
    "data-renderer": renderer,
    "data-layout": frame.layout,
    "data-species": String(species),
    "data-axis": frame.axis?.label,
  };
}

/** From the home sky a star runs its name; otherwise it opens its details. */
function selector(props: ConstellationProps): (node: SceneNode) => void {
  return (node) => {
    if (node.ref === null) return;
    if (props.response === null) props.onRun(node.ref.name);
    else props.onOpen(node.ref);
  };
}

function Figure(props: ConstellationProps & { readonly species: readonly Species[] }): JSX.Element {
  const { species } = props;
  const { renderer, fallBack } = useRenderer();
  const layerRef = useRef<HTMLDivElement>(null);
  const sky = useSky(species, props);
  const select = selector(props);
  const placeOn = (positions: Float32Array): void => {
    if (layerRef.current !== null) placeLabels(layerRef.current, positions);
  };
  return (
    <figure
      aria-label="Constellation"
      className="absolute inset-0 m-0"
      {...dataOf(sky.frame, renderer, species.length)}
    >
      <SkyDrawing
        species={species}
        sky={sky}
        renderer={renderer}
        onLabels={placeOn}
        onPick={select}
        onFallback={fallBack}
      />
      <SceneLabels
        layerRef={layerRef}
        nodes={namedNodes(sky.frame)}
        marks={sky.marks}
        hovered={sky.hovered}
        highlighted={sky.highlighted}
        onSelect={select}
        onFocusNode={sky.focus}
      />
      <Recenter navigation={sky.navigation} inset={sky.inset} />
      <Relations frame={sky.frame} />
    </figure>
  );
}

/** The 151 species as a sky that each query rearranges (ADR 12). */
export function Constellation(props: ConstellationProps): JSX.Element | null {
  const species = useSpecies();
  if (species.data === undefined) return null;
  return <Figure {...props} species={species.data.species} />;
}
