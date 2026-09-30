import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

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

window.matchMedia = noMatch;
window.ResizeObserver = StillObserver;

afterEach(() => {
  cleanup();
});
