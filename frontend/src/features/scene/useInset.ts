import { useEffect, useState } from "react";

import type { Inset } from "./protocol";

/** The results panel: 26rem wide plus its margin beside the sky, or a sheet over 58% of a narrow screen. */
const PANEL_WIDTH = 432;
const SHEET_SHARE = 0.58;
/** The home cards along the bottom: one row when wide, stacked when narrow. */
const HOME_SHARE = 0.22;
const NARROW_HOME_SHARE = 0.4;
const WIDE = "(min-width: 640px)";

interface Screen {
  readonly wide: boolean;
  readonly height: number;
}

function measure(): Screen {
  return { wide: window.matchMedia(WIDE).matches, height: window.innerHeight };
}

/** The part of the viewport the results or the home cards cover, which the sky centers away from. */
export function useInset(panel: boolean): Inset {
  const [screen, setScreen] = useState<Screen>(measure);
  useEffect(() => {
    const update = (): void => {
      setScreen(measure());
    };
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
    };
  }, []);
  if (!panel) {
    const share = screen.wide ? HOME_SHARE : NARROW_HOME_SHARE;
    return { right: 0, bottom: Math.round(screen.height * share) };
  }
  return screen.wide
    ? { right: PANEL_WIDTH, bottom: 0 }
    : { right: 0, bottom: Math.round(screen.height * SHEET_SHARE) };
}
