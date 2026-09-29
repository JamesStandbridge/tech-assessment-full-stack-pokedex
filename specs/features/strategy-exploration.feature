Feature: Explore a strategy spanning connected information
  An experienced trainer builds a rain team and wants related abilities,
  moves and Pokémon in one search.

  A weather word leads to the abilities and moves whose effects depend on it,
  then to the Pokémon that carry or learn them. Each result is labelled as a
  benefit or a drawback.

  Pitfalls in the dataset:
  - "rain" is a substring of drain, brain, rainbow and trainers.
  - No rain setter exists: rain-dance, drizzle and weather-ball are absent.
    drought, a sun setter, is the only weather setter.
  - thunder gains 100% accuracy in rain only in its long effect.
  - solar-beam is halved in rain; cloud-nine negates weather.
  - Effects say "strong sunlight" and "Sunny Day", never "sun".
  - The dataset never says rain boosts Water moves.
  - sand-attack has nothing to do with sandstorms.

  @SRCH-STRAT-001 @SRCH-STRAT-002 @SRCH-STRAT-004
  Scenario: A rain team
    When I search for "rain team"
    Then the outcome is "results"
    And the results include:
      | result             |
      | ability:swift-swim |
      | ability:rain-dish  |
      | ability:hydration  |
      | ability:dry-skin   |
      | move:thunder       |
      | pokemon:kabutops   |
      | pokemon:golduck    |
      | pokemon:tentacruel |
      | pokemon:vaporeon   |
      | pokemon:lapras     |
    And the results exclude:
      | result               |
      | move:absorb          |
      | move:mega-drain      |
      | move:leech-life      |
      | move:leech-seed      |
      | move:dream-eater     |
      | move:whirlwind       |
      | move:roar            |
      | move:blizzard        |
      | ability:pressure     |
      | ability:levitate     |
      | ability:magic-guard  |
      | ability:mold-breaker |
      | ability:anticipation |
      | ability:forewarn     |
      | ability:frisk        |
      | ability:chlorophyll  |
      | pokemon:alakazam     |
      | pokemon:dodrio       |
      | pokemon:starmie      |
      | pokemon:machop       |
      | pokemon:golbat       |
      | pokemon:charmander   |
    And "pokemon:kabutops" ranks before "pokemon:pikachu"

  @SRCH-STRAT-001 @SRCH-STRAT-002
  Scenario: Pokémon that benefit from rain
    When I search for "pokemon that benefit from rain"
    Then the outcome is "results"
    And the results include:
      | result             |
      | pokemon:kabutops   |
      | pokemon:omastar    |
      | pokemon:golduck    |
      | pokemon:poliwrath  |
      | pokemon:blastoise  |
      | pokemon:tentacruel |
      | pokemon:lapras     |
      | pokemon:vaporeon   |
      | pokemon:jynx       |
      | pokemon:parasect   |
    And the results exclude:
      | result               |
      | pokemon:charmander   |
      | pokemon:starmie      |
      | pokemon:alakazam     |
      | ability:mold-breaker |

  @SRCH-STRAT-006 @should
  Scenario: A weather relation wins over a plain speed ranking
    When I search for "faster in the rain"
    Then the outcome is "results"
    And "ability:swift-swim" is within the first 1 results of its kind
    And the results include:
      | result           |
      | pokemon:kabutops |
    And the results exclude:
      | result              |
      | pokemon:electrode   |
      | ability:chlorophyll |
      | ability:sand-rush   |

  @SRCH-STRAT-005
  Scenario: A move absent from the dataset is not invented
    When I search for "rain dance"
    Then the outcome is "results"
    And the results include:
      | result             |
      | move:thunder       |
      | ability:swift-swim |

  @SRCH-STRAT-003 @SRCH-STRAT-004
  Scenario: A sun team maps "sun" to the dataset vocabulary
    When I search for "sun team"
    Then the outcome is "results"
    And the results include:
      | result              |
      | ability:chlorophyll |
      | ability:solar-power |
      | ability:drought     |
      | ability:leaf-guard  |
      | move:solar-beam     |
      | move:growth         |
      | pokemon:ninetales   |
      | pokemon:vulpix      |
      | pokemon:venusaur    |
    And the results exclude:
      | result             |
      | ability:swift-swim |
      | ability:rain-dish  |
      | ability:hydration  |
      | pokemon:magneton   |

  @SRCH-STRAT-001 @SRCH-STRAT-002
  Scenario: A sandstorm team ignores moves that only share a word
    When I search for "sandstorm team"
    Then the outcome is "results"
    And the results include:
      | result             |
      | ability:sand-veil  |
      | ability:sand-rush  |
      | ability:sand-force |
      | pokemon:sandslash  |
      | pokemon:dugtrio    |
    And the results exclude:
      | result           |
      | move:sand-attack |
      | pokemon:pidgey   |

  @SRCH-STRAT-001
  Scenario: A hail team
    When I search for "hail team"
    Then the outcome is "results"
    And the results include:
      | result             |
      | ability:snow-cloak |
      | ability:ice-body   |
      | move:blizzard      |
      | pokemon:articuno   |
      | pokemon:dewgong    |
