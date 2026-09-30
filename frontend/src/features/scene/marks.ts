import type { Cluster } from "../../domain/constellation";
import { displayName } from "../../domain/entities";
import { point } from "../../domain/geometry";
import type { SceneFrame } from "../../domain/scene";
import type { Mark } from "./protocol";

const AXIS_LABEL_DROP = 1.6;
const RING_LABEL_LIFT = 1.1;

function isHome(frame: SceneFrame): boolean {
  return frame.nodes.every((node) => node.emphasis === "idle");
}

/** The fixed labels of a frame: cluster names at home, the ends of an axis, the names of rings. */
export function marksOf(frame: SceneFrame, clusters: readonly Cluster[]): readonly Mark[] {
  if (isHome(frame)) {
    return clusters.map((cluster) => ({
      id: `cluster:${cluster.type}`,
      label: displayName(cluster.type),
      position: cluster.center,
    }));
  }
  const axis = frame.axis;
  const axisMarks: readonly Mark[] =
    axis === null
      ? []
      : [
          { id: "axis:low", label: String(axis.min), position: axis.from },
          { id: "axis:high", label: String(axis.max), position: axis.to },
          {
            id: "axis:name",
            label: axis.label,
            position: point(0, axis.from.y - AXIS_LABEL_DROP, axis.from.z),
          },
        ];
  const ringMarks = frame.rings.map((ring) => ({
    id: `ring:${ring.name}`,
    label: ring.name,
    position: point(0, ring.radius + RING_LABEL_LIFT, 0),
  }));
  return [...axisMarks, ...ringMarks];
}
