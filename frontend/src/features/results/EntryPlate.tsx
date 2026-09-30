import type { JSX } from "react";

import type { Result } from "../../api/contract";
import { assertNever } from "../../domain/assertNever";
import { displayName } from "../../domain/entities";
import { RemoteImage } from "../../ui/RemoteImage";
import { TypeGlyph } from "../../ui/typeGlyphs";

const PLATE = "specimen grid size-14 shrink-0 place-items-center";

function AbilityMark(): JSX.Element {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.1}
      strokeLinecap="round"
      className="text-muted size-7"
    >
      <path d="M8 2.5v2.2M8 11.3v2.2M2.5 8h2.2M11.3 8h2.2M4.1 4.1l1.6 1.6M10.3 10.3l1.6 1.6M4.1 11.9l1.6-1.6M10.3 5.7l1.6-1.6" />
      <path d="M6.2 8a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0-3.6 0" />
    </svg>
  );
}

/** The square at the left of a result: the sprite of a Pokémon, the type of a move, a mark for an ability. */
export function EntryPlate({ result }: { readonly result: Result }): JSX.Element {
  switch (result.kind) {
    case "pokemon":
      return (
        <div className={PLATE}>
          <RemoteImage src={result.sprite_url} alt={displayName(result.name)} size={48} />
        </div>
      );
    case "move":
      return (
        <div
          aria-hidden="true"
          className={PLATE}
          style={{ color: `var(--color-tint-${result.type}, var(--color-muted))` }}
        >
          <TypeGlyph type={result.type} className="size-7" />
        </div>
      );
    case "ability":
      return (
        <div aria-hidden="true" className={PLATE}>
          <AbilityMark />
        </div>
      );
    default:
      return assertNever(result);
  }
}
