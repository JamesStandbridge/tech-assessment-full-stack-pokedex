import { useMemo, useState } from "react";

import type { SearchResponse, Species } from "../../api/contract";
import { constellation, typeClusters } from "../../domain/constellation";
import { neighbours, type SceneFrame, sceneFrame } from "../../domain/scene";
import type { SceneNode } from "../../domain/sceneTypes";
import { marksOf } from "./marks";
import type { Inset, Mark } from "./protocol";
import { useInset } from "./useInset";
import { type Navigation, useNavigation } from "./useNavigation";

/** What the sky shows: the query it answers and what covers part of it. */
export interface SkyInput {
  readonly response: SearchResponse | null;
  readonly panel: boolean;
  readonly workbench: boolean;
}

export interface Sky {
  readonly frame: SceneFrame;
  readonly marks: readonly Mark[];
  readonly highlighted: ReadonlySet<string>;
  readonly hovered: SceneNode | null;
  readonly inset: Inset;
  readonly navigation: Navigation;
  readonly nodeOf: (id: string) => SceneNode | undefined;
  readonly focus: (id: string | null) => void;
  readonly hover: (id: string | null) => void;
}

export function useSky(species: readonly Species[], props: SkyInput): Sky {
  const [focused, setFocused] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const places = useMemo(() => constellation(species), [species]);
  const frame = useMemo(() => sceneFrame(places, props.response), [places, props.response]);
  const marks = useMemo(
    () => marksOf(frame, typeClusters(species, places)),
    [frame, species, places],
  );
  const byId = new Map(frame.nodes.map((node) => [node.id, node]));
  const spotlight = focused ?? hovered;
  return {
    frame,
    marks,
    highlighted: spotlight === null ? new Set<string>() : neighbours(frame, spotlight),
    hovered: hovered === null ? null : (byId.get(hovered) ?? null),
    inset: useInset(props.panel, props.workbench),
    navigation: useNavigation(frame),
    nodeOf: (id) => byId.get(id),
    focus: setFocused,
    hover: setHovered,
  };
}
