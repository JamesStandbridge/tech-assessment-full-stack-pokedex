import { useState } from "react";

import type { SceneFrame } from "../../domain/scene";
import { type Pan, UNMOVED } from "./still";

/** Whether two frames share the camera the user is looking through, ignoring object identity. */
export function sameSkyView(left: SceneFrame, right: SceneFrame): boolean {
  if (left === right) return true;
  const a = left.camera;
  const b = right.camera;
  return (
    left.layout === right.layout &&
    left.weather === right.weather &&
    a.distance === b.distance &&
    a.aspect === b.aspect &&
    a.target.x === b.target.x &&
    a.target.y === b.target.y &&
    a.target.z === b.target.z
  );
}

export interface Navigation {
  /** How the user moved the still map. */
  readonly pan: Pan;
  /** Whether the user moved the view since the frame changed or the view recentered. */
  readonly moved: boolean;
  readonly navigate: (move: (pan: Pan) => Pan) => void;
  /** The user moved a view the page does not hold, such as the camera of the scene. */
  readonly touch: () => void;
  readonly recenter: () => void;
}

interface Held {
  readonly frame: SceneFrame;
  readonly pan: Pan;
  readonly moved: boolean;
}

/** How the user moved the view of a frame; a new frame starts unmoved. */
export function useNavigation(frame: SceneFrame): Navigation {
  const [held, setHeld] = useState<Held>({ frame, pan: UNMOVED, moved: false });
  const current = sameSkyView(held.frame, frame)
    ? { ...held, frame }
    : { frame, pan: UNMOVED, moved: false };
  const navigate = (move: (pan: Pan) => Pan): void => {
    setHeld((previous) => ({
      frame,
      pan: move(sameSkyView(previous.frame, frame) ? previous.pan : UNMOVED),
      moved: true,
    }));
  };
  return {
    pan: current.pan,
    moved: current.moved,
    navigate,
    touch: () => {
      navigate((pan) => pan);
    },
    recenter: () => {
      setHeld({ frame, pan: UNMOVED, moved: false });
    },
  };
}
