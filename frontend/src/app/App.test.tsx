import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { FakeApi } from "../test/FakeApi";
import { App } from "./App";

test("the page names the product", () => {
  render(<App api={new FakeApi()} />);
  expect(screen.getByRole("heading", { level: 1, name: "Pokédex Constellation" })).toBeInTheDocument();
});
