import type { JSX } from "react";

import { type ComboOption, ComboBox } from "../../ui/ComboBox";
import { useSuggestions } from "./queries";
import type { SearchController } from "./useSearchController";

interface SearchBoxProps {
  readonly controller: SearchController;
}

/** The search field, with entity and concept suggestions for the typed text (SYS-UI-015). */
export function SearchBox({ controller }: SearchBoxProps): JSX.Element {
  const suggestions = useSuggestions(controller.input);
  const items = suggestions.data?.suggestions ?? [];
  const options: readonly ComboOption[] = items.map((item) => ({
    id: `${item.kind}:${item.label}`,
    label: item.label,
  }));
  const choose = (option: ComboOption): void => {
    const item = items.find((candidate) => `${candidate.kind}:${candidate.label}` === option.id);
    if (item !== undefined) controller.run(item.query);
  };
  return (
    <form
      role="search"
      className="flex w-full items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <ComboBox
        label="Search the Pokédex"
        placeholder="A name, a stat, an effect or a weather: try bulba or rain team"
        inputValue={controller.input}
        options={controller.typing ? options : []}
        onInputChange={controller.type}
        onChoose={choose}
        onSubmit={controller.submit}
      />
    </form>
  );
}
