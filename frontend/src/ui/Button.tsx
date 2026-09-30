import type { JSX, ReactNode } from "react";
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from "react-aria-components";

type Variant = "primary" | "quiet" | "outline";

interface ButtonProps extends Omit<AriaButtonProps, "className" | "children" | "style"> {
  readonly variant?: Variant;
  readonly children: ReactNode;
}

const BASE =
  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors " +
  "outline-none data-[focus-visible]:ring-3 data-[focus-visible]:ring-focus " +
  "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 cursor-pointer";

const VARIANTS: Readonly<Record<Variant, string>> = {
  primary: "bg-accent text-white data-[hovered]:bg-accent-soft",
  quiet: "text-muted data-[hovered]:bg-panel-raised data-[hovered]:text-text",
  outline: "border border-line text-text data-[hovered]:border-muted",
};

export function Button({ variant = "quiet", children, ...props }: ButtonProps): JSX.Element {
  return (
    <AriaButton {...props} className={`${BASE} ${VARIANTS[variant]}`}>
      {children}
    </AriaButton>
  );
}
