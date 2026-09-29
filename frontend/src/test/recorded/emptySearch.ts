import type { SearchResponse } from "../../api/contract";

export const emptySearch = {
  query: "xyzzy",
  canonical_query: "xyzzy",
  outcome: "empty",
  interpretation: {
    alternatives: [
      {
        kinds: [],
        name: "xyzzy",
        dex_number: null,
        types: [],
        characteristics: [],
        stat_sort: [],
        stat_filters: [],
        damage_classes: [],
        effect: null,
        weather: null,
        relation: null,
      },
    ],
    summary: "names matching 'xyzzy'",
  },
  terms: [
    {
      text: "xyzzy",
      role: "ignored",
      value: null,
    },
  ],
  notices: [
    {
      code: "ignored-terms",
      message: "Not understood, so ignored: xyzzy.",
    },
  ],
  explanation: "No Pokémon, move or ability in this dataset is named like 'xyzzy'.",
  suggestions: [
    {
      kind: "example",
      label: "Try 'bulba'",
      query: "bulba",
    },
    {
      kind: "example",
      label: "Try 'fast electric pokemon'",
      query: "fast electric pokemon",
    },
    {
      kind: "example",
      label: "Try 'put the opponent to sleep'",
      query: "put the opponent to sleep",
    },
    {
      kind: "example",
      label: "Try 'rain team'",
      query: "rain team",
    },
  ],
  best_match: null,
  refinements: [],
  sections: [],
} satisfies SearchResponse;
