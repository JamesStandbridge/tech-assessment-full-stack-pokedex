import { useEffect, useState } from "react";

import { preferredRenderer, REDUCED_MOTION, type Renderer } from "./support";

export interface RendererChoice {
  readonly renderer: Renderer;
  /** The scene cannot run smoothly: the still map takes over for the rest of the visit. */
  readonly fallBack: () => void;
}

/** The renderer of the constellation, which gives way to the still map as soon as motion is unwelcome. */
export function useRenderer(): RendererChoice {
  const [renderer, setRenderer] = useState<Renderer>(preferredRenderer);
  useEffect(() => {
    const query = window.matchMedia(REDUCED_MOTION);
    const follow = (): void => {
      if (query.matches) setRenderer("still");
    };
    query.addEventListener("change", follow);
    return () => {
      query.removeEventListener("change", follow);
    };
  }, []);
  return {
    renderer,
    fallBack: () => {
      setRenderer("still");
    },
  };
}
