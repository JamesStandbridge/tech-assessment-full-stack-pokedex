import type { JSX, KeyboardEvent } from "react";
import {
  ComboBox as AriaComboBox,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  type Key,
} from "react-aria-components";

export interface ComboOption {
  readonly id: string;
  readonly label: string;
}

interface ComboBoxProps {
  readonly label: string;
  readonly placeholder: string;
  readonly inputValue: string;
  readonly options: readonly ComboOption[];
  readonly onInputChange: (value: string) => void;
  readonly onChoose: (option: ComboOption) => void;
  /** Enter pressed while no option is active: the typed text is the choice. */
  readonly onSubmit: () => void;
}

function OptionList(): JSX.Element {
  return (
    <Popover className="border-line bg-panel-raised shadow-glow w-(--trigger-width) rounded-2xl border p-1">
      <ListBox className="max-h-72 overflow-y-auto outline-none">
        {(option: ComboOption) => (
          <ListBoxItem
            id={option.id}
            textValue={option.label}
            className="data-[focused]:bg-panel data-[focused]:text-accent-soft cursor-pointer rounded-xl px-4 py-2 outline-none"
          >
            {option.label}
          </ListBoxItem>
        )}
      </ListBox>
    </Popover>
  );
}

/** A text field that offers options while typing; Enter submits the text itself. */
export function ComboBox(props: ComboBoxProps): JSX.Element {
  const { label, placeholder, inputValue, options, onInputChange, onChoose, onSubmit } = props;
  const choose = (key: Key | null): void => {
    const option = options.find((candidate) => candidate.id === key);
    if (option !== undefined) onChoose(option);
  };
  const submitOnEnter = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "Enter" && !event.currentTarget.hasAttribute("aria-activedescendant")) {
      onSubmit();
    }
  };
  return (
    <AriaComboBox
      allowsCustomValue
      allowsEmptyCollection
      menuTrigger="input"
      inputValue={inputValue}
      onInputChange={onInputChange}
      onChange={choose}
      items={options}
      className="relative w-full"
    >
      <Label className="sr-only">{label}</Label>
      <Input
        placeholder={placeholder}
        onKeyDown={submitOnEnter}
        className="border-line bg-panel text-text placeholder:text-muted data-[focused]:border-accent w-full rounded-full border px-6 py-4 text-lg outline-none"
      />
      <OptionList />
    </AriaComboBox>
  );
}
