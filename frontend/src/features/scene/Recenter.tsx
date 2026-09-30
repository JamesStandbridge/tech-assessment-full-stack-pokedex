import type { JSX } from "react";

import { Button } from "../../ui/Button";
import type { Inset } from "./protocol";
import type { Navigation } from "./useNavigation";

const CORNER_GAP = 12;

/** Brings the view back once the user moved it, from the top right corner of the free sky. */
export function Recenter(props: {
  readonly navigation: Navigation;
  readonly inset: Inset;
}): JSX.Element | null {
  const { navigation, inset } = props;
  if (!navigation.moved) return null;
  return (
    <div
      className="bg-panel/80 absolute rounded-full"
      style={{ top: inset.top + CORNER_GAP, right: inset.right + CORNER_GAP }}
    >
      <Button variant="outline" size="small" onPress={navigation.recenter}>
        Recenter
      </Button>
    </div>
  );
}
