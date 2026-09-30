import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach } from "vitest";

import { resetMotionStore } from "../features/motion/useMotion";

class StillObserver implements ResizeObserver {
  readonly disconnect = (): void => undefined;
  readonly observe = (): void => undefined;
  readonly unobserve = (): void => undefined;
}

function noMatch(query: string): MediaQueryList {
  const list: MediaQueryList = Object.assign(new EventTarget(), {
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
  });
  return list;
}

/** Lazy chunks and the workers of a full verify run make the default second of waiting too short. */
configure({ asyncUtilTimeout: 3000 });

/** Longer than the throttle of nuqs, so a test's last address update lands before the next test. */
const ADDRESS_FLUSH_MS = 60;

window.matchMedia = noMatch;
Element.prototype.scrollIntoView = (): void => undefined;
window.ResizeObserver = StillObserver;

afterEach(async () => {
  cleanup();
  await new Promise((resolve) => setTimeout(resolve, ADDRESS_FLUSH_MS));
  window.localStorage.clear();
  resetMotionStore();
  delete document.documentElement.dataset["motion"];
  window.history.replaceState(null, "", "/");
});
