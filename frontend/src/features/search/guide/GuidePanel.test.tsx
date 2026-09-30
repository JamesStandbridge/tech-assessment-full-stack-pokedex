import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";

import { bulbaSearch } from "../../../test/recorded/bulbaSearch";
import { Understanding } from "../Understanding";
import { QueryGuide } from "./QueryGuide";

test("an example runs its query and closes the guide", async () => {
  const onRun = vi.fn();
  const onOpenChange = vi.fn();
  render(<QueryGuide open section={null} onOpenChange={onOpenChange} onRun={onRun} />);
  const guide = await screen.findByRole("dialog", { name: "How to ask" });
  expect(await within(guide).findByRole("heading", { name: "Recover a name" })).toBeVisible();
  expect(within(guide).getByRole("heading", { name: "Compare by criteria" })).toBeVisible();
  expect(within(guide).getByRole("heading", { name: "Discover by effect" })).toBeVisible();
  expect(within(guide).getByRole("heading", { name: "Explore a strategy" })).toBeVisible();
  const examples = within(guide).getByRole("list", { name: "Compare by criteria examples" });
  await userEvent.click(
    within(examples).getByRole("button", { name: "fast electric pokemon" }),
  );
  expect(onRun).toHaveBeenCalledOnce();
  expect(onRun).toHaveBeenCalledWith("fast electric pokemon");
  expect(onOpenChange).toHaveBeenCalledWith(false);
});

test("escape closes the guide", async () => {
  const onOpenChange = vi.fn();
  render(<QueryGuide open section="effect" onOpenChange={onOpenChange} onRun={vi.fn()} />);
  const heading = await screen.findByRole("heading", { name: "Discover by effect" });
  expect(heading).toHaveFocus();
  await userEvent.keyboard("{Escape}");
  expect(onOpenChange).toHaveBeenCalledWith(false);
});

test("a suggestion says what to ask instead", async () => {
  const onRun = vi.fn();
  render(<QueryGuide open section={null} onOpenChange={vi.fn()} onRun={onRun} />);
  const guide = await screen.findByRole("dialog", { name: "How to ask" });
  const misses = (await within(guide).findAllByRole("list", { name: "Not understood" }))[0];
  if (misses === undefined) throw new Error("The guide has no misses.");
  await userEvent.click(within(misses).getByRole("button", { name: "bulba" }));
  expect(onRun).toHaveBeenCalledOnce();
  expect(onRun).toHaveBeenCalledWith("bulba");
});

test("an approximate match links to the guide", async () => {
  const onOpenGuide = vi.fn();
  const response = {
    ...bulbaSearch,
    notices: [
      { code: "approximate-match", message: "No exact match; these results are approximate." },
    ],
  };
  render(<Understanding response={response} onRun={vi.fn()} onOpenGuide={onOpenGuide} />);
  await userEvent.click(screen.getByRole("button", { name: "How to ask about a name" }));
  expect(onOpenGuide).toHaveBeenCalledOnce();
  expect(onOpenGuide).toHaveBeenCalledWith("name");
});
