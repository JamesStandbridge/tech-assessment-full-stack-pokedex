import {
  CanvasTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  NearestFilter,
  SRGBColorSpace,
} from "three/webgpu";

import type { Emblem } from "../../../domain/sceneTypes";
import { EMBLEM_SIZE, emblemStrokes } from "../emblems";
import type { StarSeed } from "../protocol";
import { ATLAS_COLUMNS, ATLAS_ROWS, EMBLEM_ROWS } from "./starMaterial";

const CELL = 96;
/** Emblems are thin lines, drawn finer than the sprites and filtered smoothly. */
const EMBLEM_PIXELS = 128;

export interface Atlas {
  readonly texture: CanvasTexture<OffscreenCanvas>;
  /** Resolves once every sprite that could be fetched is drawn. */
  readonly ready: Promise<void>;
}

async function bitmapOf(url: string): Promise<ImageBitmap | null> {
  try {
    const response = await fetch(url, { mode: "cors" });
    return response.ok ? await createImageBitmap(await response.blob()) : null;
  } catch (error) {
    if (error instanceof TypeError || error instanceof DOMException) return null;
    throw error;
  }
}

/** Draw every sprite into one texture, one cell per species in the order of the seeds. */
export function spriteAtlas(seeds: readonly StarSeed[]): Atlas {
  const canvas = new OffscreenCanvas(ATLAS_COLUMNS * CELL, ATLAS_ROWS * CELL);
  const context = canvas.getContext("2d");
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.magFilter = NearestFilter;
  texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;
  const draws = seeds.map(async (seed, index) => {
    if (seed.sprite === null || context === null) return;
    const bitmap = await bitmapOf(seed.sprite);
    if (bitmap === null) return;
    const x = (index % ATLAS_COLUMNS) * CELL;
    const y = Math.floor(index / ATLAS_COLUMNS) * CELL;
    context.drawImage(bitmap, x, y, CELL, CELL);
    bitmap.close();
  });
  const ready = Promise.all(draws).then(() => {
    texture.needsUpdate = true;
  });
  return { texture, ready };
}

/** An empty atlas for the emblems of the moves, abilities and weathers on stage. */
export function emblemAtlas(): CanvasTexture<OffscreenCanvas> {
  const canvas = new OffscreenCanvas(ATLAS_COLUMNS * EMBLEM_PIXELS, EMBLEM_ROWS * EMBLEM_PIXELS);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  return texture;
}

/** Engrave an emblem in white into a cell of the emblem atlas, for the material to ink. */
export function engrave(
  texture: CanvasTexture<OffscreenCanvas>,
  cell: number,
  emblem: Emblem,
): void {
  const context = texture.image.getContext("2d");
  if (context === null) return;
  const size = EMBLEM_PIXELS;
  const x = (cell % ATLAS_COLUMNS) * size;
  const y = Math.floor(cell / ATLAS_COLUMNS) * size;
  context.clearRect(x, y, size, size);
  context.strokeStyle = "#ffffff";
  context.lineCap = "round";
  context.lineJoin = "round";
  for (const stroke of emblemStrokes(emblem)) {
    const unit = size / EMBLEM_SIZE;
    const scale = unit * stroke.scale;
    context.setTransform(scale, 0, 0, scale, x + stroke.x * unit, y + stroke.y * unit);
    context.lineWidth = stroke.width;
    context.stroke(new Path2D(stroke.d));
  }
  context.setTransform(1, 0, 0, 1, 0, 0);
  texture.needsUpdate = true;
}
