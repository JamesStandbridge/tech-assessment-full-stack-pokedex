import type { Point } from "../../domain/geometry";
import type { SceneFrame } from "../../domain/scene";

export interface Viewport {
  readonly width: number;
  readonly height: number;
  readonly pixelRatio: number;
}

/** A species as the engine draws it: its sprite, its color, and its slot in the atlas. */
export interface StarSeed {
  readonly name: string;
  readonly sprite: string | null;
  readonly color: string;
}

/** A fixed point the page labels, such as the name of a cluster. */
export interface Mark {
  readonly id: string;
  readonly label: string;
  readonly position: Point;
}

/** The parts of the viewport covered by the header, the results and the workbench, which the camera centers away from. */
export interface Inset {
  readonly top: number;
  readonly left: number;
  readonly right: number;
  readonly bottom: number;
}

export const NO_INSET: Inset = { top: 0, left: 0, right: 0, bottom: 0 };

export type Backend = "webgpu" | "webgl2";

export type ToWorker =
  | {
      readonly type: "start";
      readonly canvas: OffscreenCanvas;
      readonly viewport: Viewport;
      readonly species: readonly StarSeed[];
    }
  | { readonly type: "resize"; readonly viewport: Viewport }
  | { readonly type: "inset"; readonly inset: Inset }
  | { readonly type: "stage"; readonly frame: SceneFrame; readonly marks: readonly Mark[] }
  | { readonly type: "highlight"; readonly ids: readonly string[] }
  | { readonly type: "hover"; readonly x: number; readonly y: number }
  | { readonly type: "leave" }
  | { readonly type: "drag"; readonly dx: number; readonly dy: number }
  | { readonly type: "zoom"; readonly delta: number }
  | { readonly type: "click"; readonly x: number; readonly y: number };

/**
 * Screen positions of the tracked points, four numbers each: x and y in CSS
 * pixels, a scale for the label, and 1 when the point is in front of the camera.
 * The order is the named nodes of the frame, then its marks, then the hovered star.
 */
export const LABEL_STRIDE = 4;

export type FromWorker =
  | { readonly type: "ready"; readonly backend: Backend }
  | { readonly type: "fps"; readonly value: number }
  | { readonly type: "lost" }
  | { readonly type: "failed"; readonly message: string }
  | { readonly type: "labels"; readonly positions: Float32Array }
  | { readonly type: "hover"; readonly id: string | null }
  | { readonly type: "pick"; readonly id: string };
