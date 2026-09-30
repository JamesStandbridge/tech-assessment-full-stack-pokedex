import { CanvasTexture, LinearFilter, NearestFilter, SRGBColorSpace } from "three/webgpu";

import type { StarSeed } from "../protocol";
import { ATLAS_COLUMNS, ATLAS_ROWS } from "./starMaterial";

const CELL = 96;

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
