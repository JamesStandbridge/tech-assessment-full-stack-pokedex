import type { JSX, ReactNode } from "react";
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from "react-aria-components";

type Variant = "primary" | "outline" | "quiet" | "link" | "title";

interface ButtonProps extends Omit<AriaButtonProps, "className" | "children" | "style"> {
  readonly variant?: Variant;
  readonly children: ReactNode;
}

const BASE =
  "inline-flex items-center gap-2 transition-colors outline-none cursor-pointer text-left " +
  "data-[focus-visible]:outline-2 data-[focus-visible]:outline-offset-3 data-[focus-visible]:outline-rubric " +
  "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-45";

const ACTION = "label px-3 py-2 rounded-[2px]";

const VARIANTS: Readonly<Record<Variant, string>> = {
  primary: `${ACTION} bg-ink text-paper data-[hovered]:bg-rubric-deep`,
  outline: `${ACTION} border border-ink/70 text-ink data-[hovered]:bg-paper-deep`,
  quiet: `${ACTION} text-ink-soft data-[hovered]:text-ink data-[hovered]:bg-paper-deep`,
  link:
    "underline decoration-rule-strong decoration-1 underline-offset-3 text-ink " +
    "data-[hovered]:decoration-rubric data-[hovered]:text-rubric-deep",
  title:
    "font-display text-[1.35em] leading-tight text-ink decoration-rubric decoration-1 " +
    "underline-offset-4 data-[hovered]:underline",
};

export function Button({ variant = "quiet", children, ...props }: ButtonProps): JSX.Element {
  return (
    <AriaButton {...props} className={`${BASE} ${VARIANTS[variant]}`}>
      {children}
    </AriaButton>
  );
}
