import type { SearchResponse } from "../../api/contract";

export const rainTeamSearch = {
  query: "rain team",
  canonical_query: "rain",
  outcome: "results",
  interpretation: {
    alternatives: [
      {
        kinds: [],
        name: null,
        dex_number: null,
        types: [],
        characteristics: [],
        stat_sort: [],
        stat_filters: [],
        damage_classes: [],
        effect: null,
        weather: {
          weather: "rain",
          stat: null,
        },
        relation: null,
      },
    ],
    summary: "linked to rain",
  },
  terms: [
    {
      text: "rain",
      role: "weather",
      value: "rain",
    },
    {
      text: "team",
      role: "filler",
      value: null,
    },
  ],
  notices: [
    {
      code: "missing-mechanic",
      message:
        "No move or ability in this dataset sets rain; these results benefit from it once it is active.",
    },
  ],
  explanation: null,
  suggestions: [],
  best_match: null,
  refinements: [],
  sections: [
    {
      kind: "ability",
      total: 5,
      results: [
        {
          name: "swift-swim",
          rank: 1,
          reasons: [
            {
              type: "weather",
              detail: "Benefits from rain, raises speed",
              related: null,
              probability: null,
              mode: null,
              target: null,
              weather_role: "benefit",
            },
          ],
          kind: "ability",
          id: 33,
          short_effect: "Doubles Speed during rain.",
          generation: "generation-iii",
        },
        {
          name: "rain-dish",
          rank: 2,
          reasons: [
            {
              type: "weather",
              detail: "Benefits from rain",
              related: null,
              probability: null,
              mode: null,
              target: null,
              weather_role: "benefit",
            },
          ],
          kind: "ability",
          id: 44,
          short_effect: "Heals for 1/16 max HP after each turn during rain.",
          generation: "generation-iii",
        },
        {
          name: "dry-skin",
          rank: 3,
          reasons: [
            {
              type: "weather",
              detail: "Benefits from rain",
              related: null,
              probability: null,
              mode: null,
              target: null,
              weather_role: "benefit",
            },
          ],
          kind: "ability",
          id: 87,
          short_effect:
            "Causes 1/8 max HP in damage each turn during strong sunlight, but heals for 1/8 max HP during rain. Increases damage from Fire moves to 1.25×, but absorbs Water moves, healing for 1/4 max HP.",
          generation: "generation-iv",
        },
        {
          name: "hydration",
          rank: 4,
          reasons: [
            {
              type: "weather",
              detail: "Benefits from rain",
              related: null,
              probability: null,
              mode: null,
              target: null,
              weather_role: "benefit",
            },
          ],
          kind: "ability",
          id: 93,
          short_effect: "Cures any major status ailment after each turn during rain.",
          generation: "generation-iv",
        },
        {
          name: "cloud-nine",
          rank: 5,
          reasons: [
            {
              type: "weather",
              detail: "Is hindered by rain",
              related: null,
              probability: null,
              mode: null,
              target: null,
              weather_role: "drawback",
            },
          ],
          kind: "ability",
          id: 13,
          short_effect: "Negates all effects of weather, but does not prevent the weather itself.",
          generation: "generation-iii",
        },
      ],
      next_cursor: null,
    },
    {
      kind: "move",
      total: 2,
      results: [
        {
          name: "thunder",
          rank: 1,
          reasons: [
            {
              type: "weather",
              detail: "Benefits from rain",
              related: null,
              probability: null,
              mode: null,
              target: null,
              weather_role: "benefit",
            },
          ],
          kind: "move",
          id: 87,
          type: "electric",
          damage_class: "special",
          power: 110,
          accuracy: 70,
          pp: 10,
          priority: 0,
          effect_chance: 30,
          short_effect: "Has a chance to paralyze the target.",
        },
        {
          name: "solar-beam",
          rank: 2,
          reasons: [
            {
              type: "weather",
              detail: "Is hindered by rain",
              related: null,
              probability: null,
              mode: null,
              target: null,
              weather_role: "drawback",
            },
          ],
          kind: "move",
          id: 76,
          type: "grass",
          damage_class: "special",
          power: 120,
          accuracy: 100,
          pp: 10,
          priority: 0,
          effect_chance: null,
          short_effect: "Requires a turn to charge before attacking.",
        },
      ],
      next_cursor: null,
    },
    {
      kind: "pokemon",
      total: 73,
      results: [
        {
          name: "lapras",
          rank: 1,
          reasons: [
            {
              type: "weather",
              detail: "Is hindered by rain through solar-beam",
              related: {
                kind: "move",
                name: "solar-beam",
              },
              probability: null,
              mode: null,
              target: null,
              weather_role: "drawback",
            },
            {
              type: "weather",
              detail: "Benefits from rain through thunder",
              related: {
                kind: "move",
                name: "thunder",
              },
              probability: null,
              mode: null,
              target: null,
              weather_role: "benefit",
            },
            {
              type: "weather",
              detail: "Benefits from rain through hydration",
              related: {
                kind: "ability",
                name: "hydration",
              },
              probability: null,
              mode: null,
              target: null,
              weather_role: "benefit",
            },
          ],
          kind: "pokemon",
          id: 131,
          types: ["water", "ice"],
          stats: {
            hp: 130,
            attack: 85,
            defense: 80,
            "special-attack": 85,
            "special-defense": 95,
            speed: 60,
          },
          abilities: ["hydration", "shell-armor", "water-absorb"],
          genus: "Transport Pokémon",
          description:
            "A POKéMON that has been over hunted almost to extinction. It can ferry people across the water.",
          sprite_url:
            "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/131.png",
          artwork_url:
            "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/131.png",
        },
        {
          name: "squirtle",
          rank: 2,
          reasons: [
            {
              type: "weather",
              detail: "Benefits from rain through rain-dish",
              related: {
                kind: "ability",
                name: "rain-dish",
              },
              probability: null,
              mode: null,
              target: null,
              weather_role: "benefit",
            },
          ],
          kind: "pokemon",
          id: 7,
          types: ["water"],
          stats: {
            hp: 44,
            attack: 48,
            defense: 65,
            "special-attack": 50,
            "special-defense": 64,
            speed: 43,
          },
          abilities: ["rain-dish", "torrent"],
          genus: "Tiny Turtle Pokémon",
          description:
            "After birth, its back swells and hardens into a shell. Powerfully sprays foam from its mouth.",
          sprite_url:
            "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png",
          artwork_url:
            "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png",
        },
        {
          name: "wartortle",
          rank: 3,
          reasons: [
            {
              type: "weather",
              detail: "Benefits from rain through rain-dish",
              related: {
                kind: "ability",
                name: "rain-dish",
              },
              probability: null,
              mode: null,
              target: null,
              weather_role: "benefit",
            },
          ],
          kind: "pokemon",
          id: 8,
          types: ["water"],
          stats: {
            hp: 59,
            attack: 63,
            defense: 80,
            "special-attack": 65,
            "special-defense": 80,
            speed: 58,
          },
          abilities: ["rain-dish", "torrent"],
          genus: "Turtle Pokémon",
          description:
            "Often hides in water to stalk unwary prey. For swimming fast, it moves its ears to maintain balance.",
          sprite_url:
            "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/8.png",
          artwork_url:
            "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/8.png",
        },
        {
          name: "blastoise",
          rank: 4,
          reasons: [
            {
              type: "weather",
              detail: "Benefits from rain through rain-dish",
              related: {
                kind: "ability",
                name: "rain-dish",
              },
              probability: null,
              mode: null,
              target: null,
              weather_role: "benefit",
            },
          ],
          kind: "pokemon",
          id: 9,
          types: ["water"],
          stats: {
            hp: 79,
            attack: 83,
            defense: 100,
            "special-attack": 85,
            "special-defense": 105,
            speed: 78,
          },
          abilities: ["rain-dish", "torrent"],
          genus: "Shellfish Pokémon",
          description:
            "A brutal POKéMON with pressurized water jets on its shell. They are used for high speed tackles.",
          sprite_url:
            "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/9.png",
          artwork_url:
            "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/9.png",
        },
        {
          name: "poliwag",
          rank: 5,
          reasons: [
            {
              type: "weather",
              detail: "Benefits from rain, raises speed through swift-swim",
              related: {
                kind: "ability",
                name: "swift-swim",
              },
              probability: null,
              mode: null,
              target: null,
              weather_role: "benefit",
            },
          ],
          kind: "pokemon",
          id: 60,
          types: ["water"],
          stats: {
            hp: 40,
            attack: 50,
            defense: 40,
            "special-attack": 40,
            "special-defense": 40,
            speed: 90,
          },
          abilities: ["damp", "swift-swim", "water-absorb"],
          genus: "Tadpole Pokémon",
          description:
            "Its newly grown legs prevent it from running. It appears to prefer swimming than trying to stand.",
          sprite_url:
            "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/60.png",
          artwork_url:
            "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/60.png",
        },
      ],
      next_cursor:
        "eyJraW5kIjoicG9rZW1vbiIsIm9mZnNldCI6NSwiZmluZ2VycHJpbnQiOiJlYmU2M2JjNmUzNmIxM2JiIn0",
    },
  ],
} satisfies SearchResponse;
