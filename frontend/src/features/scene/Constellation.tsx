import { type JSX, useRef, useState } from "react";

import type { EntityRef, SearchResponse, Species } from "../../api/contract";
import { constellation, typeClusters } from "../../domain/constellation";
import { linkLabel, namedNodes, neighbours, type SceneFrame, sceneFrame } from "../../domain/scene";
import type { SceneNode } from "../../domain/sceneTypes";
import { ConstellationCanvas } from "./ConstellationCanvas";
import { marksOf } from "./marks";
import { typeHex } from "./palette";
import type { Inset, Mark } from "./protocol";
import { placeLabels, SceneLabels } from "./SceneLabels";
import { StillMap } from "./StillMap";
import { preferredRenderer, type Renderer } from "./support";
import { useInset } from "./useInset";
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

interface Sky {
  readonly frame: SceneFrame;
  readonly marks: readonly Mark[];
  readonly highlighted: ReadonlySet<string>;
  readonly hovered: SceneNode | null;
  readonly inset: Inset;
  readonly nodeOf: (id: string) => SceneNode | undefined;
  readonly focus: (id: string | null) => void;
  readonly hover: (id: string | null) => void;
}

function useSky(species: readonly Species[], props: ConstellationProps): Sky {
  const [focused, setFocused] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const places = constellation(species);
  const frame = sceneFrame(places, props.response);
  const byId = new Map(frame.nodes.map((node) => [node.id, node]));
  const spotlight = focused ?? hovered;
  return {
    frame,
    marks: marksOf(frame, typeClusters(species, places)),
    highlighted: spotlight === null ? new Set<string>() : neighbours(frame, spotlight),
    hovered: hovered === null ? null : (byId.get(hovered) ?? null),
    inset: useInset(props.panel, props.workbench),
    nodeOf: (id) => byId.get(id),
    focus: setFocused,
    hover: setHovered,
  };
}

function colorsOf(species: readonly Species[]): ReadonlyMap<string, string> {
  return new Map(species.map((one) => [`pokemon:${one.name}`, typeHex(one.types[0] ?? "normal")]));
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

function Drawing(props: {
  readonly species: readonly Species[];
  readonly sky: Sky;
  readonly renderer: Renderer;
  readonly onLabels: (positions: Float32Array) => void;
  readonly onPick: (node: SceneNode) => void;
  readonly onFallback: () => void;
}): JSX.Element {
  const { species, sky, renderer, onLabels } = props;
  const common = { frame: sky.frame, marks: sky.marks, inset: sky.inset, onLabels };
  if (renderer === "still") {
    return <StillMap {...common} colors={colorsOf(species)} highlighted={sky.highlighted} />;
  }
  return (
    <ConstellationCanvas
      {...common}
      species={species}
      highlighted={[...sky.highlighted]}
      onHover={sky.hover}
      onPick={(id) => {
        const node = sky.nodeOf(id);
        if (node !== undefined) props.onPick(node);
      }}
      onFallback={props.onFallback}
    />
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
  const [renderer, setRenderer] = useState<Renderer>(preferredRenderer);
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
      <Drawing
        species={species}
        sky={sky}
        renderer={renderer}
        onLabels={placeOn}
        onPick={select}
        onFallback={() => {
          setRenderer("still");
        }}
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
