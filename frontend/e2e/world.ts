import { expect, type Locator, type Page } from "@playwright/test";

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
      const record = (spoken?: string): void => {
        const played = Number(Reflect.get(window, "__pokedexSounds") ?? 0);
        Object.assign(window, { __pokedexSounds: played + 1 });
        if (spoken !== undefined) Object.assign(window, { __pokedexSpoken: spoken });
      };
      Object.assign(window, { __pokedexSounds: 0, __pokedexViolations: "" });
      document.addEventListener("securitypolicyviolation", (event) => {
        const seen = String(Reflect.get(window, "__pokedexViolations"));
        const violation = `${event.effectiveDirective} ${event.blockedURI}`;
        Object.assign(window, { __pokedexViolations: `${seen}${violation}\n` });
      });
      document.addEventListener(
        "play",
        () => {
          record();
        },
        true,
      );
      if ("speechSynthesis" in window) {
        const synthesis = window.speechSynthesis;
        const speak = synthesis.speak.bind(synthesis);
        synthesis.speak = (utterance: SpeechSynthesisUtterance) => {
          record(utterance.text);
          speak(utterance);
        };
      }
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
    return this.section(ref.kind).getByRole("article", {
      name: displayName(ref.name),
      exact: true,
    });
  }

  openButton(ref: EntityRef): Locator {
    return this.result(ref).getByRole("button", { name: displayName(ref.name), exact: true });
  }

  details(ref: EntityRef): Locator {
    return this.page.getByRole("dialog", { name: displayName(ref.name) });
  }

  /** Type a query and press Enter; the search is done once the URL holds it. */
  async search(query: string): Promise<void> {
    await this.searchBox().fill(query);
    await this.searchBox().press("Enter");
    await expect.poll(() => new URL(this.page.url()).searchParams.get("q")).toBe(query.trim());
  }
}
