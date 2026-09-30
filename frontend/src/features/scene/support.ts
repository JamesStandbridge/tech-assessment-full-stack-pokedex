/** Which renderer draws the constellation: the GPU scene, or the still map (SYS-UI-025). */
export type Renderer = "scene" | "still";

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

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

/** Pick the renderer once, from what the browser offers and what the user prefers. */
export function preferredRenderer(): Renderer {
  if (prefersReducedMotion() || savesData() || !canDrawOffscreen() || !hasGpu()) return "still";
  return "scene";
}

/** Below this frame rate over the first second, the scene gives way to the still map. */
export const MIN_FPS = 24;
