import type { SearchResponse } from "../../api/contract";

export const bulbaSearch = {
  query: "bulba",
  canonical_query: "bulba",
  outcome: "results",
  interpretation: {
    alternatives: [
      {
        kinds: [],
        name: "bulba",
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
    summary: "names matching 'bulba'",
  },
  terms: [
    {
      text: "bulba",
      role: "name",
      value: "bulba",
    },
  ],
  notices: [],
  explanation: null,
  suggestions: [],
  best_match: {
    kind: "pokemon",
    name: "bulbasaur",
  },
  refinements: [],
  sections: [
    {
      kind: "pokemon",
      total: 1,
      results: [
        {
          name: "bulbasaur",
          rank: 1,
          reasons: [
            {
              type: "name-prefix",
              detail: "Name starts with the query",
              related: null,
              probability: null,
              mode: null,
              target: null,
              weather_role: null,
            },
          ],
          kind: "pokemon",
          id: 1,
          types: ["grass", "poison"],
          stats: {
            hp: 45,
            attack: 49,
            defense: 49,
            "special-attack": 65,
            "special-defense": 65,
            speed: 45,
          },
          abilities: ["chlorophyll", "overgrow"],
          genus: "Seed Pokémon",
          description:
            "A strange seed was planted on its back at birth. The plant sprouts and grows with this POKéMON.",
          sprite_url:
            "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png",
          artwork_url:
            "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png",
        },
      ],
      next_cursor: null,
    },
  ],
} satisfies SearchResponse;
