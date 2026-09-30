import type { JSX } from "react";

import type { EntityKind, EntityRef } from "../../api/contract";
import { displayName } from "../../domain/entities";
import { Button } from "../../ui/Button";

interface RelatedListProps {
  readonly title: string;
  readonly kind: EntityKind;
  readonly names: readonly string[];
  readonly onOpen: (ref: EntityRef) => void;
}

/** Related entities of a detail, each of which opens in turn (SYS-UI-016). */
export function RelatedList({ title, kind, names, onOpen }: RelatedListProps): JSX.Element | null {
  if (names.length === 0) return null;
  return (
    <div>
      <h3 className="catalogue text-muted mb-2 flex items-baseline gap-2">
        {title}
        <span aria-hidden="true" className="leader flex-1" />
        <span className="tabular-nums">{names.length}</span>
      </h3>
      <ul aria-label={title} className="flex flex-wrap gap-1.5">
        {names.map((name) => (
          <li key={name}>
            <Button
              variant="outline"
              size="small"
              onPress={() => {
                onOpen({ kind, name });
              }}
            >
              {displayName(name)}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
