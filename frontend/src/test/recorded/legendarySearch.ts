import type { SearchResponse } from "../../api/contract";

export const legendarySearch = {
  query: "legendary pokemon",
  canonical_query: "legendary pokemon",
  outcome: "results",
  interpretation: {
    alternatives: [
      {
        kinds: ["pokemon"],
        name: null,
        dex_number: null,
        types: [],
        characteristics: [
          {
            facet: "legendary",
            value: "true",
          },
        ],
        stat_sort: [],
        stat_filters: [],
        damage_classes: [],
        effect: null,
        weather: null,
        relation: null,
      },
    ],
    summary: "Pokémon, legendary true",
  },
  terms: [
    {
      text: "legendary",
      role: "characteristic",
      value: "legendary:true",
    },
    {
      text: "pokemon",
      role: "kind",
      value: "pokemon",
    },
  ],
  notices: [],
  explanation: null,
  suggestions: [],
  best_match: null,
  refinements: [
    {
      constraint: "kind:pokemon",
      action: "remove",
      label: "Any kind instead of pokemon",
      query: "legendary",
    },
  ],
  sections: [
    {
      kind: "pokemon",
      total: 4,
      results: [
        {
          name: "articuno",
          rank: 1,
          reasons: [
            {
              type: "characteristic",
              detail: "legendary: true",
              related: null,
              probability: null,
              mode: null,
              target: null,
              weather_role: null,
            },
          ],
          kind: "pokemon",
          id: 144,
          types: ["ice", "flying"],
          stats: {
            hp: 90,
            attack: 85,
            defense: 100,
            "special-attack": 95,
            "special-defense": 125,
            speed: 85,
          },
          abilities: ["pressure", "snow-cloak"],
          genus: "Freeze Pokémon",
          description:
            "A legendary bird POKéMON that is said to appear to doomed people who are lost in icy mountains.",
          sprite_url:
            "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/144.png",
          artwork_url:
            "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/144.png",
        },
        {
          name: "zapdos",
          rank: 2,
          reasons: [
            {
              type: "characteristic",
              detail: "legendary: true",
              related: null,
              probability: null,
              mode: null,
              target: null,
              weather_role: null,
            },
          ],
          kind: "pokemon",
          id: 145,
          types: ["electric", "flying"],
          stats: {
            hp: 90,
            attack: 90,
            defense: 85,
            "special-attack": 125,
            "special-defense": 90,
            speed: 100,
          },
          abilities: ["pressure", "static"],
          genus: "Electric Pokémon",
          description:
            "A legendary bird POKéMON that is said to appear from clouds while dropping enormous lightning bolts.",
          sprite_url:
            "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/145.png",
          artwork_url:
            "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/145.png",
        },
        {
          name: "moltres",
          rank: 3,
          reasons: [
            {
              type: "characteristic",
              detail: "legendary: true",
              related: null,
              probability: null,
              mode: null,
              target: null,
              weather_role: null,
            },
          ],
          kind: "pokemon",
          id: 146,
          types: ["fire", "flying"],
          stats: {
            hp: 90,
            attack: 100,
            defense: 90,
            "special-attack": 125,
            "special-defense": 85,
            speed: 90,
          },
          abilities: ["flame-body", "pressure"],
          genus: "Flame Pokémon",
          description:
            "Known as the legendary bird of fire. Every flap of its wings creates a dazzling flash of flames.",
          sprite_url:
            "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/146.png",
          artwork_url:
            "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/146.png",
        },
        {
          name: "mewtwo",
          rank: 4,
          reasons: [
            {
              type: "characteristic",
              detail: "legendary: true",
              related: null,
              probability: null,
              mode: null,
              target: null,
              weather_role: null,
            },
          ],
          kind: "pokemon",
          id: 150,
          types: ["psychic"],
          stats: {
            hp: 106,
            attack: 110,
            defense: 90,
            "special-attack": 154,
            "special-defense": 90,
            speed: 130,
          },
          abilities: ["pressure", "unnerve"],
          genus: "Genetic Pokémon",
          description:
            "It was created by a scientist after years of horrific gene splicing and DNA engineering experiments.",
          sprite_url:
            "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png",
          artwork_url:
            "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png",
        },
      ],
      next_cursor: null,
    },
  ],
} satisfies SearchResponse;
