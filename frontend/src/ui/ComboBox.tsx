import { type JSX, type KeyboardEvent, use, useEffect, useRef } from "react";
import {
  ComboBox as AriaComboBox,
  ComboBoxStateContext,
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

/**
 * Options that arrive after the keystroke that asked for them do not open the
 * list by themselves; open it once for every new set of options while focused.
 */
function OpenOnNewOptions({ options }: { readonly options: readonly ComboOption[] }): null {
  const state = use(ComboBoxStateContext);
  const openedForRef = useRef("");
  const signature = options.map((option) => option.id).join("|");
  useEffect(() => {
    if (state === null || signature === "" || signature === openedForRef.current) return;
    if (state.isFocused && !state.isOpen) {
      openedForRef.current = signature;
      state.open(null, "input");
    }
  }, [state, signature]);
  return null;
}

interface Choice {
  readonly choose: (key: Key | null) => void;
  readonly changeInput: (value: string) => void;
}

/** React Aria writes the chosen label into the field; that write is dropped. */
function useChoice(props: ComboBoxProps): Choice {
  const chosenRef = useRef<string | null>(null);
  const choose = (key: Key | null): void => {
    const option = props.options.find((candidate) => candidate.id === key);
    if (option === undefined) return;
    chosenRef.current = option.label;
    props.onChoose(option);
  };
  const changeInput = (value: string): void => {
    const chosen = chosenRef.current;
    chosenRef.current = null;
    if (value !== chosen) props.onInputChange(value);
  };
  return { choose, changeInput };
}

/**
 * A text field that offers options while typing; Enter submits the text itself.
 * Choosing an option leaves the text to the caller instead of the option label.
 */
export function ComboBox(props: ComboBoxProps): JSX.Element {
  const { label, placeholder, inputValue, options, onSubmit } = props;
  const { choose, changeInput } = useChoice(props);
  const submitOnEnter = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "Enter" && !event.currentTarget.hasAttribute("aria-activedescendant")) {
      onSubmit();
    }
  };
  return (
    <AriaComboBox
      allowsCustomValue
      menuTrigger="input"
      inputValue={inputValue}
      onInputChange={changeInput}
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
      <OpenOnNewOptions options={options} />
    </AriaComboBox>
  );
}
