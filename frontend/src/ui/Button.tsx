import type { JSX, ReactNode } from "react";
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from "react-aria-components";

type Variant = "primary" | "quiet" | "outline";
type Size = "regular" | "small";

interface ButtonProps extends Omit<AriaButtonProps, "className" | "children" | "style"> {
  readonly variant?: Variant;
  readonly size?: Size;
  readonly children: ReactNode;
}

const BASE =
  "inline-flex items-center gap-2 rounded-full font-medium transition-colors " +
  "outline-none data-[focus-visible]:ring-3 data-[focus-visible]:ring-focus " +
  "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 cursor-pointer";

const SIZES: Readonly<Record<Size, string>> = {
  regular: "px-4 py-2 text-sm",
  small: "px-2 py-0.5 text-xs",
};

const VARIANTS: Readonly<Record<Variant, string>> = {
  primary: "bg-accent text-white data-[hovered]:bg-accent-soft",
  quiet: "text-muted data-[hovered]:bg-panel-raised data-[hovered]:text-text",
  outline: "border border-line text-text data-[hovered]:border-muted",
};

export function Button({
  variant = "quiet",
  size = "regular",
  children,
  ...props
}: ButtonProps): JSX.Element {
  return (
    <AriaButton {...props} className={`${BASE} ${SIZES[size]} ${VARIANTS[variant]}`}>
      {children}
    </AriaButton>
  );
}
