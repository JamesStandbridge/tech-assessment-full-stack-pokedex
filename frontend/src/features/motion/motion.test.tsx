import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { JSX } from "react";
import { afterEach, expect, test, vi } from "vitest";

import { DisplayPreferences } from "./DisplayPreferences";
import { MotionToggle } from "./MotionToggle";
import { useDocumentMotion } from "./useMotion";

function mediaList(query: string, reduced: boolean, compact: boolean) {
  return Object.assign(new EventTarget(), {
    matches: (query.includes("reduced") && reduced) || (query.includes("width") && compact),
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
  });
}

function systemMotion(reduced: boolean): { readonly flip: (reduced: boolean) => void } {
  const lists: ReturnType<typeof mediaList>[] = [];
  vi.spyOn(window, "matchMedia").mockImplementation((query: string) => {
    const list = mediaList(query, reduced, false);
    lists.push(list);
    return list;
  });
  return {
    flip: (next) => {
      reduced = next;
      for (const list of lists) {
        list.matches = list.media.includes("reduced") && next;
        list.dispatchEvent(new Event("change"));
      }
    },
  };
}

function Probe(): JSX.Element {
  useDocumentMotion();
  return <MotionToggle />;
}

function motion(): string | undefined {
  return document.documentElement.dataset["motion"];
}

function option(name: string): HTMLElement {
  return within(screen.getByRole("radiogroup", { name: "Motion" })).getByRole("radio", { name });
}

afterEach(() => {
  delete document.documentElement.dataset["motion"];
});

test("motion follows the system until the user picks one, which is kept", async () => {
  const system = systemMotion(true);
  render(<Probe />);
  expect(option("System")).toBeChecked();
  await waitFor(() => {
    expect(motion()).toBe("reduced");
  });
  system.flip(false);
  await waitFor(() => {
    expect(motion()).toBe("full");
  });
  await userEvent.click(option("Animated"));
  expect(option("Animated")).toBeChecked();
  expect(motion()).toBe("full");
  expect(window.localStorage.getItem("pokedex:motion")).toBe("animated");
  system.flip(true);
  expect(motion()).toBe("full");
  await userEvent.click(option("Still"));
  expect(motion()).toBe("reduced");
  expect(window.localStorage.getItem("pokedex:motion")).toBe("still");
  system.flip(false);
  expect(motion()).toBe("reduced");
});

test("choosing animated again is a new attempt", async () => {
  systemMotion(true);
  render(<Probe />);
  await userEvent.click(option("Animated"));
  const first = window.localStorage.getItem("pokedex:motion");
  await userEvent.click(option("Animated"));
  expect(first).toBe("animated");
  expect(option("Animated")).toBeChecked();
  expect(motion()).toBe("full");
});

test("a narrow window folds theme and motion into Display", async () => {
  vi.spyOn(window, "matchMedia").mockImplementation((query: string) =>
    mediaList(query, false, true),
  );
  render(<DisplayPreferences />);
  expect(screen.queryByRole("radiogroup", { name: "Motion" })).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Display" }));
  expect(screen.getByRole("radiogroup", { name: "Motion" })).toBeInTheDocument();
  expect(screen.getByRole("radiogroup", { name: "Theme" })).toBeInTheDocument();
});

test("a wide window shows theme and motion together", () => {
  vi.spyOn(window, "matchMedia").mockImplementation((query: string) =>
    mediaList(query, false, false),
  );
  render(<DisplayPreferences />);
  expect(screen.getByRole("radiogroup", { name: "Motion" })).toBeInTheDocument();
  expect(screen.getByRole("radiogroup", { name: "Theme" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Display" })).not.toBeInTheDocument();
});
