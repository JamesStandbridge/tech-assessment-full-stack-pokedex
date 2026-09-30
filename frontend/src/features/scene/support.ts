import type { Renderer } from "../../domain/motion";

export type { Renderer };

interface DataSaver {
  readonly saveData: boolean;
}

function isDataSaver(value: unknown): value is DataSaver {
  return (
    typeof value === "object" && value !== null && "saveData" in value && value.saveData === true
  );
}

function savesData(): boolean {
  return "connection" in navigator && isDataSaver(navigator.connection);
}

function hasGpu(): boolean {
  if ("gpu" in navigator && navigator.gpu !== undefined) return true;
  return document.createElement("canvas").getContext("webgl2") !== null;
}

function canDrawOffscreen(): boolean {
  return (
    typeof Worker !== "undefined" &&
    typeof OffscreenCanvas !== "undefined" &&
    "transferControlToOffscreen" in HTMLCanvasElement.prototype
  );
}

export interface SceneEnvironment {
  readonly savesData: boolean;
  readonly capable: boolean;
}

/** What the browser can draw with, read once for the visit. */
export function sceneEnvironment(): SceneEnvironment {
  return { savesData: savesData(), capable: canDrawOffscreen() && hasGpu() };
}

/** Below this frame rate over the first second, the scene gives way to the still map. */
export const MIN_FPS = 24;
