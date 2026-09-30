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
    <Popover
      offset={6}
      className="plate motion-safe:data-[entering]:animate-rise w-(--trigger-width) p-1"
    >
      <ListBox className="scroll-area max-h-72 outline-none">
        {(option: ComboOption) => (
          <ListBoxItem
            id={option.id}
            textValue={option.label}
            className="rounded-control data-[focused]:border-accent data-[focused]:bg-panel-raised cursor-pointer border-l-2 border-transparent px-3 py-2 outline-none"
          >
            {option.label}
          </ListBoxItem>
        )}
      </ListBox>
    </Popover>
  );
}

function Reticle(): JSX.Element {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="text-muted pointer-events-none absolute top-1/2 left-4 size-4.5 -translate-y-1/2"
    >
      <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="1.25" />
      <path d="M10 1v5M10 14v5M1 10h5M14 10h5" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="10" cy="10" r="1" fill="var(--color-accent)" />
    </svg>
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
      <Reticle />
      <Input
        placeholder={placeholder}
        onKeyDown={submitOnEnter}
        className="rounded-plate border-rule bg-panel text-text placeholder:text-muted data-[focused]:border-accent data-[hovered]:border-text/60 data-[focused]:ring-accent/25 shadow-plate w-full border py-3 pr-12 pl-11 text-[0.95rem] transition-colors outline-none data-[focused]:ring-4 motion-reduce:transition-none"
      />
      <OptionList />
      <OpenOnNewOptions options={options} />
    </AriaComboBox>
  );
}
