import type { JSX, ReactNode } from "react";

interface CheckboxProps {
  /** The accessible name; parts of it may be visible to assistive technologies only. */
  readonly label: ReactNode;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly disabled?: boolean;
}

/** A native checkbox drawn as a compact toggle beside the hairline buttons. */
export function Checkbox({
  label,
  checked,
  onChange,
  disabled = false,
}: CheckboxProps): JSX.Element {
  return (
    <label className="rounded-control border-line text-muted hover:border-rule hover:bg-panel-raised hover:text-text has-checked:border-accent has-checked:text-text has-focus-visible:ring-accent has-focus-visible:ring-offset-ink inline-flex min-h-7 cursor-pointer items-center gap-1.5 border px-2 py-0.5 text-xs font-medium select-none has-focus-visible:ring-2 has-focus-visible:ring-offset-2 has-disabled:cursor-not-allowed has-disabled:opacity-45">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => {
          onChange(event.currentTarget.checked);
        }}
        className="accent-accent size-3.5 outline-none"
      />
      {label}
    </label>
  );
}
