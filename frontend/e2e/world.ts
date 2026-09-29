import type { Locator, Page } from "@playwright/test";

import type { EntityKind, EntityRef } from "../src/api/contract";
import { displayName, kindLabel } from "../src/domain/entities";

const KINDS: readonly EntityKind[] = ["pokemon", "move", "ability"];

export function parseRef(text: string): EntityRef {
  const [kind, name] = text.split(":");
  const known = KINDS.find((candidate) => candidate === kind);
  if (known === undefined || name === undefined) {
    throw new Error(`Not an entity reference: ${text}`);
  }
  return { kind: known, name };
}

/** The accessible contract of the interface, shared by every step. */
export class PokedexWorld {
  readonly searches: string[] = [];

  constructor(readonly page: Page) {}

  async install(): Promise<void> {
    this.page.on("request", (request) => {
      const url = new URL(request.url());
      if (url.pathname === "/api/search") this.searches.push(url.searchParams.get("q") ?? "");
    });
    await this.page.addInitScript(() => {
      const counter = { sounds: 0 };
      Object.defineProperty(window, "__pokedexSounds", { get: () => counter.sounds });
      const play = HTMLMediaElement.prototype.play.bind(HTMLMediaElement.prototype);
      HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
        counter.sounds += 1;
        return play.call(this);
      };
      const speak = window.speechSynthesis.speak.bind(window.speechSynthesis);
      window.speechSynthesis.speak = (utterance: SpeechSynthesisUtterance) => {
        counter.sounds += 1;
        Object.assign(window, { __pokedexSpoken: utterance.text });
        speak(utterance);
      };
    });
  }

  searchBox(): Locator {
    return this.page.getByRole("combobox", { name: "Search the Pokédex" });
  }

  resultsRegion(): Locator {
    return this.page.getByRole("region", { name: "Results" });
  }

  section(kind: EntityKind): Locator {
    return this.resultsRegion().getByRole("region", { name: kindLabel(kind, 2), exact: true });
  }

  result(ref: EntityRef): Locator {
    return this.section(ref.kind).getByRole("article", { name: displayName(ref.name) });
  }

  openButton(ref: EntityRef): Locator {
    return this.result(ref).getByRole("button", { name: displayName(ref.name), exact: true });
  }

  details(ref: EntityRef): Locator {
    return this.page.getByRole("dialog", { name: displayName(ref.name) });
  }

  async search(query: string): Promise<void> {
    await this.searchBox().fill(query);
    await this.searchBox().press("Enter");
  }
}
