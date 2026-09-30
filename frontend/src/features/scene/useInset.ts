import { useEffect, useState } from "react";

import type { Inset } from "./protocol";

/** The results panel: 26rem wide plus its margin beside the sky, or a sheet over 58% of a narrow screen. */
const PANEL_WIDTH = 432;
const SHEET_SHARE = 0.58;
/** The party and the bench: 26rem wide plus its margin, beside the sky only when the screen is wide. */
const WORKBENCH_WIDTH = 432;
const WIDE = "(min-width: 640px)";

interface Screen {
  readonly wide: boolean;
  readonly height: number;
  /** Where the app bar ends, with the examples it holds on the home page. */
  readonly top: number;
}

function measure(): Screen {
  const header = document.querySelector("header");
  return {
    wide: window.matchMedia(WIDE).matches,
    height: window.innerHeight,
    top: Math.round(header?.getBoundingClientRect().bottom ?? 0),
  };
}

function useScreen(): Screen {
  const [screen, setScreen] = useState<Screen>(measure);
  useEffect(() => {
    const update = (): void => {
      setScreen(measure());
    };
    const observer = new ResizeObserver(update);
    const header = document.querySelector("header");
    if (header !== null) observer.observe(header);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);
  return screen;
}

/** The part of the viewport the app bar, the results or the workbench cover, which the sky centers away from. */
export function useInset(panel: boolean, workbench: boolean): Inset {
  const screen = useScreen();
  const { top } = screen;
  const left = workbench && screen.wide ? WORKBENCH_WIDTH : 0;
  if (!panel) return { top, left, right: 0, bottom: 0 };
  return screen.wide
    ? { top, left, right: PANEL_WIDTH, bottom: 0 }
    : { top, left, right: 0, bottom: Math.round(screen.height * SHEET_SHARE) };
}
