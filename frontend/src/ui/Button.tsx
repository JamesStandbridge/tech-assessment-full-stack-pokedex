import type { JSX, ReactNode } from "react";
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from "react-aria-components";

type Variant = "primary" | "quiet" | "outline" | "link";
type Size = "regular" | "small" | "inline";

interface ButtonProps extends Omit<AriaButtonProps, "className" | "children" | "style"> {
  readonly variant?: Variant;
  readonly size?: Size;
  readonly children: ReactNode;
}

const BASE =
  "inline-flex items-center gap-2 rounded-control font-medium cursor-pointer select-none " +
  "outline-none transition-[color,background-color,border-color,translate] duration-150 ease-(--ease-plate) " +
  "data-[pressed]:translate-y-px motion-reduce:transition-none motion-reduce:data-[pressed]:translate-y-0 " +
  "data-[focus-visible]:ring-2 data-[focus-visible]:ring-accent data-[focus-visible]:ring-offset-2 " +
  "data-[focus-visible]:ring-offset-ink data-[disabled]:cursor-not-allowed data-[disabled]:opacity-45";

const SIZES: Readonly<Record<Size, string>> = {
  regular: "min-h-10 px-4 py-2 text-sm",
  small: "min-h-8 px-2.5 py-1 text-[0.8125rem]",
  inline: "text-left",
};

const VARIANTS: Readonly<Record<Variant, string>> = {
  primary:
    "border border-accent bg-accent text-ink data-[hovered]:border-accent-bright " +
    "data-[hovered]:bg-accent-bright data-[pressed]:border-accent-deep data-[pressed]:bg-accent-deep",
  quiet:
    "border border-transparent text-muted data-[hovered]:bg-panel-raised data-[hovered]:text-text " +
    "data-[pressed]:bg-ink",
  outline:
    "border border-rule bg-panel text-text data-[hovered]:border-text data-[hovered]:bg-panel-raised " +
    "data-[pressed]:bg-ink",
  link:
    "text-text underline decoration-transparent decoration-1 underline-offset-4 " +
    "data-[hovered]:decoration-accent data-[pressed]:text-accent",
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
