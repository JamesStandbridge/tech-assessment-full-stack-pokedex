import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";

import { THEME_INKS } from "../features/theme/boot";
import { FakeApi } from "../test/FakeApi";
import { App } from "./App";

const STORAGE_KEY = "pokedex:theme";
const LIGHT_INK = THEME_INKS.light;
const DARK_INK = THEME_INKS.dark;

function mediaList(query: string, light: boolean) {
  return Object.assign(new EventTarget(), {
    matches: query.includes("light") && light,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
  });
}

/** The color scheme media queries, which the test flips as the operating system would. */
function systemScheme(light: boolean): { readonly flip: (light: boolean) => void } {
  const lists: ReturnType<typeof mediaList>[] = [];
  vi.spyOn(window, "matchMedia").mockImplementation((query: string) => {
    const list = mediaList(query, light);
    lists.push(list);
    return list;
  });
  return {
    flip: (next) => {
      light = next;
      for (const list of lists) {
        list.matches = list.media.includes("light") && next;
        list.dispatchEvent(new Event("change"));
      }
    },
  };
}

function theme(): string | undefined {
  return document.documentElement.dataset["theme"];
}

function option(name: string): HTMLElement {
  return within(screen.getByRole("radiogroup", { name: "Theme" })).getByRole("radio", { name });
}

afterEach(() => {
  delete document.documentElement.dataset["theme"];
});

test("the theme follows the system until the user picks one, which is kept", async () => {
  const system = systemScheme(true);
  render(<App api={new FakeApi()} />);
  expect(screen.getByRole("radiogroup", { name: "Theme" })).toBeInTheDocument();
  expect(option("System")).toBeChecked();
  expect(theme()).toBe("light");
  system.flip(false);
  await waitFor(() => {
    expect(theme()).toBe("dark");
  });
  await userEvent.click(option("Light"));
  expect(option("Light")).toBeChecked();
  expect(theme()).toBe("light");
  expect(window.localStorage.getItem(STORAGE_KEY)).toBe("light");
  system.flip(true);
  system.flip(false);
  expect(theme()).toBe("light");
});

test("a stored choice is restored, and the keyboard moves between the choices", async () => {
  systemScheme(false);
  window.localStorage.setItem(STORAGE_KEY, "light");
  render(<App api={new FakeApi()} />);
  expect(option("Light")).toBeChecked();
  expect(theme()).toBe("light");
  option("Light").focus();
  await userEvent.keyboard("{ArrowRight}");
  expect(option("Dark")).toHaveFocus();
  await userEvent.keyboard("{Enter}");
  expect(option("Dark")).toBeChecked();
  expect(theme()).toBe("dark");
  expect(window.localStorage.getItem(STORAGE_KEY)).toBe("dark");
});

function browserBar(scheme: "light" | "dark"): HTMLMetaElement {
  const meta = document.createElement("meta");
  meta.name = "theme-color";
  meta.media = `(prefers-color-scheme: ${scheme})`;
  meta.content = scheme === "light" ? LIGHT_INK : DARK_INK;
  document.head.append(meta);
  return meta;
}

test("the browser bar keeps to each color scheme until the user picks a theme", async () => {
  systemScheme(false);
  const light = browserBar("light");
  const dark = browserBar("dark");
  render(<App api={new FakeApi()} />);
  expect(light.content).toBe(LIGHT_INK);
  expect(dark.content).toBe(DARK_INK);
  await userEvent.click(option("Light"));
  expect(light.content).toBe(LIGHT_INK);
  expect(dark.content).toBe(LIGHT_INK);
  await userEvent.click(option("Dark"));
  expect(light.content).toBe(DARK_INK);
  expect(dark.content).toBe(DARK_INK);
  await userEvent.click(option("System"));
  expect(light.content).toBe(LIGHT_INK);
  expect(dark.content).toBe(DARK_INK);
  light.remove();
  dark.remove();
});
