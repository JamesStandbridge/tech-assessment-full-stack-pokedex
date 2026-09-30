import { useState } from "react";

import type { GuideSectionId } from "./section";

export interface QueryGuideState {
  readonly open: boolean;
  readonly section: GuideSectionId | null;
  readonly setOpen: (open: boolean) => void;
  readonly openGuide: (section: GuideSectionId | null) => void;
}

/** Whether the query guide is open, and which reading it should show first. */
export function useQueryGuide(): QueryGuideState {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<GuideSectionId | null>(null);
  const openGuide = (next: GuideSectionId | null): void => {
    setSection(next);
    setOpen(true);
  };
  const change = (next: boolean): void => {
    setOpen(next);
    if (!next) setSection(null);
  };
  return { open, section, setOpen: change, openGuide };
}
