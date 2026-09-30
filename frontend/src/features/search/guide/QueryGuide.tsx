import { type JSX, lazy, Suspense } from "react";
import { Button as AriaButton, DialogTrigger, Popover } from "react-aria-components";

import type { GuideSectionId } from "./section";

const GuidePanel = lazy(async () => {
  const module = await import("./GuidePanel");
  return { default: module.GuidePanel };
});

const TRIGGER =
  "catalogue text-muted cursor-pointer underline decoration-transparent decoration-1 underline-offset-4 " +
  "outline-none transition-colors duration-150 data-[hovered]:text-text data-[hovered]:decoration-accent " +
  "data-[pressed]:text-accent data-[focus-visible]:rounded-control data-[focus-visible]:ring-2 " +
  "data-[focus-visible]:ring-accent data-[focus-visible]:ring-offset-2 data-[focus-visible]:ring-offset-ink " +
  "motion-reduce:transition-none";

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
    <div className="shrink-0">
      <DialogTrigger isOpen={open} onOpenChange={onOpenChange}>
        <AriaButton className={TRIGGER}>How to ask</AriaButton>
        <Popover placement="bottom end" offset={8} className={POPOVER}>
          <Suspense fallback={<p className="text-muted p-5 text-sm">Loading the guide…</p>}>
            {open ? <GuidePanel section={section} onRun={run} /> : null}
          </Suspense>
        </Popover>
      </DialogTrigger>
    </div>
  );
}
