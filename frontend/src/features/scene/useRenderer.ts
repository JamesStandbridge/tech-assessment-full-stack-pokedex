import { useState } from "react";

import { fallbackApplies, resolveRenderer, type MotionFallback } from "../../domain/motion";
import { useMotion } from "../motion/useMotion";
import { sceneEnvironment, type Renderer } from "./support";

export interface RendererChoice {
  readonly renderer: Renderer;
  /** The scene cannot run smoothly: the still map takes over until motion is chosen again. */
  readonly fallBack: () => void;
}

/** The renderer of the constellation, following the motion preference and giving way when drawing fails. */
export function useRenderer(): RendererChoice {
  const motion = useMotion();
  const [environment] = useState(sceneEnvironment);
  const [runtime, setRuntime] = useState<MotionFallback | null>(null);
  const current = { preference: motion.preference, revision: motion.revision };
  return {
    renderer: resolveRenderer({
      preference: motion.preference,
      systemReduced: motion.systemReduced || motion.systemHeld,
      savesData: environment.savesData,
      capable: environment.capable,
      fallen: fallbackApplies(runtime, current),
    }),
    fallBack: () => {
      setRuntime({ preference: current.preference, revision: current.revision, held: true });
    },
  };
}
