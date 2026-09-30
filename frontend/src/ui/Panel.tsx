import type { JSX, ReactNode } from "react";

interface PanelProps {
  /** Name of the region for assistive technologies. */
  readonly label: string;
  /** The role of the panel, as a catalogue label above the title. */
  readonly eyebrow: string;
  readonly title: string;
  /** A tally beside the title, such as "2/6"; it is part of the heading. */
  readonly count?: string;
  readonly actions?: ReactNode;
  /** Placement classes of the plate, such as its position over the sky. */
  readonly className?: string;
  /** The body scrolls under a fixed header; the plate then needs a bounded height. */
  readonly scrolls?: boolean;
  readonly children: ReactNode;
}

/** A solid plate over the sky: a ruled header with its role, title, tally and actions, then the body. */
export function Panel(props: PanelProps): JSX.Element {
  const { label, eyebrow, title, count, actions, className = "", scrolls = false } = props;
  return (
    <section
      aria-label={label}
      className={`plate pointer-events-auto flex w-full min-w-0 flex-col ${className}`}
    >
      <header className="border-line flex shrink-0 items-center gap-3 border-b px-4 pt-3.5 pb-3 sm:px-5">
        <div className="min-w-0 flex-1">
          <p className="catalogue text-accent">{eyebrow}</p>
          <h2 className="flex items-baseline gap-2">
            <span className="font-display truncate text-2xl leading-tight font-semibold">
              {title}
            </span>
            {count === undefined ? null : (
              <>
                {" "}
                <span className="catalogue text-muted tabular-nums">{count}</span>
              </>
            )}
          </h2>
        </div>
        {actions}
      </header>
      <div
        className={`min-w-0 ${scrolls ? "scroll-area min-h-0 flex-1 px-4 py-4 sm:px-5" : "px-4 py-4 sm:px-5"}`}
      >
        {props.children}
      </div>
    </section>
  );
}
