import type { SearchResponse } from "../../api/contract";

export const fastElectricSearch = {
  query: "fast electric pokemon",
  canonical_query: "highest speed electric pokemon",
  outcome: "results",
  interpretation: {
    alternatives: [
      {
        kinds: ["pokemon"],
        name: null,
        dex_number: null,
        types: ["electric"],
        characteristics: [],
        stat_sort: [
          {
            stat: "speed",
            direction: "desc",
          },
        ],
        stat_filters: [],
        damage_classes: [],
        effect: null,
        weather: null,
        relation: null,
      },
    ],
    summary: "Pokémon, of type electric, ranked by speed, highest first",
  },
  terms: [
    {
      text: "fast",
      role: "stat",
      value: "speed:desc",
    },
    {
      text: "electric",
      role: "type",
      value: "electric",
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
      query: "highest speed electric",
    },
    {
      constraint: "type:electric",
      action: "remove",
      label: "Without type electric",
      query: "highest speed pokemon",
    },
    {
      constraint: "sort:speed",
      action: "replace",
      label: "Lowest speed first",
      query: "lowest speed electric pokemon",
    },
  ],
  sections: [
    {
      kind: "pokemon",
      total: 9,
      results: [
        {
          name: "electrode",
          rank: 1,
          reasons: [
            {
              type: "type-filter",
              detail: "Type electric",
              related: null,
              probability: null,
              mode: null,
              target: null,
              weather_role: null,
            },
            {
              type: "stat-rank",
              detail: "speed 150",
              related: null,
              probability: null,
              mode: null,
              target: null,
              weather_role: null,
            },
          ],
          kind: "pokemon",
          id: 101,
          types: ["electric"],
          stats: {
            hp: 60,
            attack: 50,
            defense: 70,
            "special-attack": 80,
            "special-defense": 80,
            speed: 150,
          },
          abilities: ["aftermath", "soundproof", "static"],
          genus: "Ball Pokémon",
          description:
            "It stores electric energy under very high pressure. It often explodes with little or no provocation.",
          sprite_url:
            "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/101.png",
          artwork_url:
            "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/101.png",
        },
        {
          name: "jolteon",
          rank: 2,
          reasons: [
            {
              type: "type-filter",
              detail: "Type electric",
              related: null,
              probability: null,
              mode: null,
              target: null,
              weather_role: null,
            },
            {
              type: "stat-rank",
              detail: "speed 130",
              related: null,
              probability: null,
              mode: null,
              target: null,
              weather_role: null,
            },
          ],
          kind: "pokemon",
          id: 135,
          types: ["electric"],
          stats: {
            hp: 65,
            attack: 65,
            defense: 60,
            "special-attack": 110,
            "special-defense": 95,
            speed: 130,
          },
          abilities: ["quick-feet", "volt-absorb"],
          genus: "Lightning Pokémon",
          description:
            "It accumulates negative ions in the atmosphere to blast out 10000- volt lightning bolts.",
          sprite_url:
            "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/135.png",
          artwork_url:
            "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/135.png",
        },
        {
          name: "raichu",
          rank: 3,
          reasons: [
            {
              type: "type-filter",
              detail: "Type electric",
              related: null,
              probability: null,
              mode: null,
              target: null,
              weather_role: null,
            },
            {
              type: "stat-rank",
              detail: "speed 110",
              related: null,
              probability: null,
              mode: null,
              target: null,
              weather_role: null,
            },
          ],
          kind: "pokemon",
          id: 26,
          types: ["electric"],
          stats: {
            hp: 60,
            attack: 90,
            defense: 55,
            "special-attack": 90,
            "special-defense": 80,
            speed: 110,
          },
          abilities: ["lightning-rod", "static"],
          genus: "Mouse Pokémon",
          description:
            "Its long tail serves as a ground to protect itself from its own high voltage power.",
          sprite_url:
            "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/26.png",
          artwork_url:
            "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/26.png",
        },
        {
          name: "electabuzz",
          rank: 4,
          reasons: [
            {
              type: "type-filter",
              detail: "Type electric",
              related: null,
              probability: null,
              mode: null,
              target: null,
              weather_role: null,
            },
            {
              type: "stat-rank",
              detail: "speed 105",
              related: null,
              probability: null,
              mode: null,
              target: null,
              weather_role: null,
            },
          ],
          kind: "pokemon",
          id: 125,
          types: ["electric"],
          stats: {
            hp: 65,
            attack: 83,
            defense: 57,
            "special-attack": 95,
            "special-defense": 85,
            speed: 105,
          },
          abilities: ["static", "vital-spirit"],
          genus: "Electric Pokémon",
          description:
            "Normally found near power plants, they can wander away and cause major blackouts in cities.",
          sprite_url:
            "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/125.png",
          artwork_url:
            "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/125.png",
        },
        {
          name: "voltorb",
          rank: 5,
          reasons: [
            {
              type: "type-filter",
              detail: "Type electric",
              related: null,
              probability: null,
              mode: null,
              target: null,
              weather_role: null,
            },
            {
              type: "stat-rank",
              detail: "speed 100",
              related: null,
              probability: null,
              mode: null,
              target: null,
              weather_role: null,
            },
          ],
          kind: "pokemon",
          id: 100,
          types: ["electric"],
          stats: {
            hp: 40,
            attack: 30,
            defense: 50,
            "special-attack": 55,
            "special-defense": 55,
            speed: 100,
          },
          abilities: ["aftermath", "soundproof", "static"],
          genus: "Ball Pokémon",
          description:
            "Usually found in power plants. Easily mistaken for a POKé BALL, they have zapped many people.",
          sprite_url:
            "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/100.png",
          artwork_url:
            "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/100.png",
        },
      ],
      next_cursor:
        "eyJraW5kIjoicG9rZW1vbiIsIm9mZnNldCI6NSwiZmluZ2VycHJpbnQiOiI1N2VlZDk4OGQ5YjIyZDEyIn0",
    },
  ],
} satisfies SearchResponse;
