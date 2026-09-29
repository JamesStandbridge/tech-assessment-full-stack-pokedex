import type { SuggestResponse } from "../../api/contract";

export const pikaSuggest = {
  suggestions: [
    {
      kind: "entity",
      label: "pikachu (pokemon)",
      query: "pikachu",
      entity: {
        kind: "pokemon",
        name: "pikachu",
      },
      concept: null,
    },
  ],
} satisfies SuggestResponse;
