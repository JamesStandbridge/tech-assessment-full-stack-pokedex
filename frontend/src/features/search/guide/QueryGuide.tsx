import { type JSX, lazy, Suspense } from "react";
import { DialogTrigger, Popover } from "react-aria-components";

import { Button } from "../../../ui/Button";
import type { GuideSectionId } from "./section";

const GuidePanel = lazy(async () => {
  const module = await import("./GuidePanel");
  return { default: module.GuidePanel };
});

const POPOVER =
  "query-guide plate z-40 flex max-h-[min(40rem,70dvh)] w-[min(36rem,calc(100vw-1.5rem))] flex-col overflow-hidden outline-none motion-safe:data-[entering]:animate-rise";

export function QueryGuide(props: {
  readonly open: boolean;
  readonly section: GuideSectionId | null;
  readonly onOpenChange: (open: boolean) => void;
  readonly onRun: (query: string) => void;
}): JSX.Element {
  const { open, section, onOpenChange, onRun } = props;
  const run = (query: string): void => {
    onRun(query);
    onOpenChange(false);
  };
  return (
    <div className="mt-2 shrink-0">
      <DialogTrigger isOpen={open} onOpenChange={onOpenChange}>
        <Button variant="outline" size="small">
          How to ask
        </Button>
        <Popover placement="bottom start" offset={8} className={POPOVER}>
          <Suspense fallback={<p className="text-muted p-5 text-sm">Loading the guide…</p>}>
            {open ? <GuidePanel section={section} onRun={run} /> : null}
          </Suspense>
        </Popover>
      </DialogTrigger>
    </div>
  );
}
