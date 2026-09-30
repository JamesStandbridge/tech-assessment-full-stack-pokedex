import type { JSX } from "react";

interface CheckboxProps {
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly disabled?: boolean;
}

/** A native checkbox with its visible label. */
export function Checkbox({
  label,
  checked,
  onChange,
  disabled = false,
}: CheckboxProps): JSX.Element {
  return (
    <label className="text-muted inline-flex cursor-pointer items-center gap-2 text-sm has-disabled:cursor-not-allowed has-disabled:opacity-50">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => {
          onChange(event.currentTarget.checked);
        }}
        className="accent-accent size-4"
      />
      {label}
    </label>
  );
}
