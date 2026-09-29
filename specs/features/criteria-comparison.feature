Feature: Find and compare candidates from practical criteria
  A trainer wants a fast Electric-type Pokémon and needs comparable
  candidates.

  Types in the query filter Pokémon as an intersection. A speed adjective
  ranks them by base speed. Every Pokémon result carries its types and base
  stats so candidates can be compared.

  Pitfalls in the dataset:
  - "fast" appears in the species descriptions of wartortle, rapidash and doduo.
  - "slow" appears in the names slowpoke and slowbro.
  - Types are modern: clefairy is Fairy, magnemite is Electric/Steel.
  - Dark exists only as the type of the move bite; no Pokémon is Dark.
  - voltorb and zapdos tie at 100 speed, so their order is not asserted.

  @SRCH-CRIT-001 @SRCH-CRIT-002 @SRCH-CRIT-003
  Scenario: Fast Pokémon of one type, ranked by speed
    When I search for "fast electric pokemon"
    Then the outcome is "results"
    And every pokemon result has the type "electric"
    And these results appear in this order:
      | result             |
      | pokemon:electrode  |
      | pokemon:jolteon    |
      | pokemon:raichu     |
      | pokemon:electabuzz |
    And "pokemon:pikachu" ranks before "pokemon:magnemite"
    And the results exclude:
      | result             |
      | pokemon:aerodactyl |
      | pokemon:mewtwo     |
      | pokemon:dugtrio    |
      | pokemon:rapidash   |
      | pokemon:wartortle  |
      | pokemon:doduo      |

  @SRCH-CRIT-002 @SRCH-CRIT-003
  Scenario: A speed synonym ranks the same way
    When I search for "quick electric type"
    Then the outcome is "results"
    And every pokemon result has the type "electric"
    And these results appear in this order:
      | result            |
      | pokemon:electrode |
      | pokemon:jolteon   |
      | pokemon:raichu    |

  @SRCH-CRIT-001
  Scenario: A type alone lists every Pokémon of that type
    When I search for "electric pokemon"
    Then the outcome is "results"
    And every pokemon result has the type "electric"
    And the results include:
      | result             |
      | pokemon:pikachu    |
      | pokemon:raichu     |
      | pokemon:magnemite  |
      | pokemon:magneton   |
      | pokemon:voltorb    |
      | pokemon:electrode  |
      | pokemon:electabuzz |
      | pokemon:jolteon    |
      | pokemon:zapdos     |

  @SRCH-CRIT-002 @SRCH-CRIT-003
  Scenario: A slow adjective reverses the ranking without matching names
    When I search for "slow fire pokemon"
    Then the outcome is "results"
    And every pokemon result has the type "fire"
    And "pokemon:growlithe" is within the first 1 results of its kind
    And "pokemon:growlithe" ranks before "pokemon:rapidash"
    And the results exclude:
      | result           |
      | pokemon:slowpoke |
      | pokemon:slowbro  |

  @SRCH-CRIT-001
  Scenario: Two types combine as an intersection
    When I search for "fast electric flying pokemon"
    Then the outcome is "results"
    And every pokemon result has the type "electric"
    And every pokemon result has the type "flying"
    And the first result is "pokemon:zapdos"

  @SRCH-CRIT-002
  Scenario: A speed adjective without a type ranks every Pokémon
    When I search for "fastest pokemon"
    Then the outcome is "results"
    And the first result is "pokemon:electrode"
    And "pokemon:jolteon" is within the first 4 results of its kind
    And "pokemon:aerodactyl" is within the first 4 results of its kind
    And "pokemon:mewtwo" is within the first 4 results of its kind

  @SRCH-CRIT-005 @SRCH-EMPTY-001
  Scenario: A type that no Pokémon has gives an explained empty outcome
    When I search for "fast dark pokemon"
    Then the outcome is "empty"
    And the response includes an explanation

  @SRCH-CRIT-001 @SYS-API-001
  Scenario: Types follow the dataset, which uses modern types
    When I search for "fairy pokemon"
    Then the outcome is "results"
    And every pokemon result has the type "fairy"
    And the results include:
      | result             |
      | pokemon:clefairy   |
      | pokemon:clefable   |
      | pokemon:jigglypuff |
      | pokemon:wigglytuff |
      | pokemon:mr-mime    |
