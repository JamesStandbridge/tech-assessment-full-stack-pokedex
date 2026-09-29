import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";

import { Bar } from "./Bar";
import { Button } from "./Button";
import { Chip } from "./Chip";
import { RemoteImage } from "./RemoteImage";
import { Spinner } from "./Spinner";

test("a button runs its action on press", async () => {
  const onPress = vi.fn();
  render(
    <Button variant="primary" onPress={onPress}>
      Search
    </Button>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Search" }));
  expect(onPress).toHaveBeenCalledOnce();
});

test("a chip shows its label and describes itself to assistive technologies", () => {
  render(<Chip label="brock" color="red" description="ignored" dashed />);
  expect(screen.getByText("brock")).toBeInTheDocument();
  expect(screen.getByText("ignored")).toHaveClass("sr-only");
});

test("a bar is a meter with its value", () => {
  render(<Bar label="Speed" value={110} share={110 / 150} color="gold" />);
  const meter = screen.getByRole("meter", { name: "Speed" });
  expect(meter).toHaveAttribute("aria-valuenow", "110");
  expect(meter).toHaveAttribute("aria-valuemax", "150");
});

test("a bar with an empty share still reports its value", () => {
  render(<Bar label="Priority" value={0} share={0} color="gold" />);
  expect(screen.getByRole("meter", { name: "Priority" })).toHaveAttribute("aria-valuemax", "0");
});

test("a spinner is a live status", () => {
  render(<Spinner label="Searching…" />);
  expect(screen.getByRole("status")).toHaveTextContent("Searching…");
});

test("an image that fails to load is replaced by a labelled placeholder", () => {
  render(<RemoteImage src="https://images.test/1.png" alt="Bulbasaur" size={96} />);
  const image = screen.getByRole("img", { name: "Bulbasaur" });
  expect(image).toHaveAttribute("loading", "lazy");
  fireEvent.error(image);
  expect(screen.getByRole("img", { name: "Bulbasaur (image unavailable)" })).toBeInTheDocument();
});

test("a missing image shows the placeholder at once", () => {
  render(<RemoteImage src={null} alt="Missingno" size={48} eager />);
  expect(screen.getByRole("img", { name: "Missingno (image unavailable)" })).toBeInTheDocument();
});
