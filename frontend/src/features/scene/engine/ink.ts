import { float, mix, uniform } from "three/tsl";
import { AdditiveBlending, type Material, NormalBlending } from "three/webgpu";

import type { Theme } from "../../../domain/theme";
import { PRINT_SHADE } from "../palette";

/** 0 on the night sky, 1 on the light one. */
const paper = uniform(0);
const glowing = new Set<Material>();

/** The factor of every colour of the scene: 1 on the night sky, darker on the light one, where colours print. */
export const printShade = mix(float(1), float(PRINT_SHADE ** 2.2), paper);

/**
 * A material whose premultiplied colour adds light on the night sky, which
 * would vanish on the light one: there it is laid over the sky instead.
 */
export function glowOrPrint<T extends Material>(material: T): T {
  glowing.add(material);
  return material;
}

export function inkFor(theme: Theme): void {
  const light = theme === "light";
  paper.value = light ? 1 : 0;
  for (const material of glowing) {
    material.blending = light ? NormalBlending : AdditiveBlending;
    material.premultipliedAlpha = light;
    material.needsUpdate = true;
  }
}
