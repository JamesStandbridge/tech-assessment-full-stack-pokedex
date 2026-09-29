import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type JSX, useState } from "react";
import { expect, test, vi } from "vitest";

import { type ComboOption, ComboBox } from "./ComboBox";
import { Dialog } from "./Dialog";

const OPTIONS: readonly ComboOption[] = [
  { id: "pikachu", label: "pikachu (pokemon)" },
  { id: "pikachu-cap", label: "pikachu cap" },
];

function Search(props: {
  readonly onChoose: (option: ComboOption) => void;
  readonly onSubmit: () => void;
}): JSX.Element {
  const [value, setValue] = useState("");
  return (
    <ComboBox
      label="Search the Pokédex"
      placeholder="Try bulba"
      inputValue={value}
      options={value.length >= 2 ? OPTIONS : []}
      onInputChange={setValue}
      onChoose={props.onChoose}
      onSubmit={props.onSubmit}
    />
  );
}

test("an option can be chosen with the keyboard", async () => {
  const onChoose = vi.fn();
  const onSubmit = vi.fn();
  render(<Search onChoose={onChoose} onSubmit={onSubmit} />);
  const input = screen.getByRole("combobox", { name: "Search the Pokédex" });
  await userEvent.type(input, "pika");
  expect(await screen.findByRole("option", { name: "pikachu (pokemon)" })).toBeInTheDocument();
  await userEvent.keyboard("{ArrowDown}{Enter}");
  expect(onChoose).toHaveBeenCalledWith(OPTIONS[0]);
  expect(onSubmit).not.toHaveBeenCalled();
});

test("Enter without an active option submits the typed text", async () => {
  const onChoose = vi.fn();
  const onSubmit = vi.fn();
  render(<Search onChoose={onChoose} onSubmit={onSubmit} />);
  await userEvent.type(screen.getByRole("combobox"), "rain team{Enter}");
  expect(onSubmit).toHaveBeenCalledOnce();
  expect(onChoose).not.toHaveBeenCalled();
});

test("a dialog is titled, and closes with its button or Escape", async () => {
  const onClose = vi.fn();
  render(
    <Dialog title="Pikachu" isOpen onClose={onClose}>
      <p>Mouse Pokémon</p>
    </Dialog>,
  );
  expect(screen.getByRole("dialog", { name: "Pikachu" })).toHaveTextContent("Mouse Pokémon");
  await userEvent.click(screen.getByRole("button", { name: "Close" }));
  await userEvent.keyboard("{Escape}");
  expect(onClose).toHaveBeenCalledTimes(2);
});
