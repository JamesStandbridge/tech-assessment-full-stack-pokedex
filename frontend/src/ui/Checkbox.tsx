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
    <label className="label text-ink-soft has-checked:text-ink inline-flex cursor-pointer items-center gap-2 has-disabled:cursor-not-allowed has-disabled:opacity-45">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => {
          onChange(event.currentTarget.checked);
        }}
        className="accent-rubric size-3.5"
      />
      {label}
    </label>
  );
}
