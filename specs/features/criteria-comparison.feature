Feature: Find and compare candidates from practical criteria
  A trainer wants a fast Electric-type Pokémon and needs comparable
  candidates.

  Types in the query filter Pokémon as an intersection. A stat, named or
  implied by an adjective, ranks them. Derived stats are the base stat total,
  bulk (hp, defense and special defense) and offense (the higher attack).
  Every Pokémon result carries its types and base stats so candidates can be
  compared.

  Pitfalls in the dataset:
  - "fast" appears in the species descriptions of wartortle, rapidash and doduo.
  - "slow" appears in the names slowpoke and slowbro.
  - Stat words are parts of move and ability names: attack in quick-attack,
    tri-attack and five more, defense in defense-curl, low in low-kick, high in
    high-jump-kick, strong near strength, quick in quick-attack, swift and
    sturdy are names on their own.
  - The data spells special-attack and special-defense; users write sp atk.
  - dragonite and mew tie at 600 base stat total; the lower Pokédex number
    ranks first.
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

  @SRCH-CRIT-001 @SRCH-CRIT-002 @SRCH-CRIT-003
  Scenario: A named stat ranks one type without matching move names
    When I search for "high attack fighting pokemon"
    Then the outcome is "results"
    And every pokemon result has the type "fighting"
    And these results appear in this order:
      | result            |
      | pokemon:machamp   |
      | pokemon:hitmonlee |
      | pokemon:machoke   |
    And the results exclude:
      | result            |
      | move:quick-attack |
      | move:tri-attack   |
      | move:horn-attack  |
      | move:sand-attack  |
      | move:sky-attack   |
      | move:fury-attack  |
      | move:wing-attack  |

  @SRCH-CRIT-001 @SRCH-CRIT-006
  Scenario Outline: Stat names are understood in their common spellings
    When I search for "<query>"
    Then the outcome is "results"
    And every pokemon result has the type "psychic"
    And the first result is "pokemon:mewtwo"
    And "pokemon:alakazam" is within the first 2 results of its kind

    Examples:
      | query                                  |
      | highest special attack psychic pokemon |
      | highest sp atk psychic pokemon         |
      | highest spatk psychic pokemon          |

  @SRCH-CRIT-002 @SRCH-CRIT-006
  Scenario: Bulk combines hp, defense and special defense
    When I search for "bulkiest pokemon"
    Then the outcome is "results"
    And these results appear in this order:
      | result           |
      | pokemon:chansey  |
      | pokemon:snorlax  |
      | pokemon:articuno |
      | pokemon:lapras   |

  @SRCH-CRIT-002 @SRCH-CRIT-003 @SRCH-CRIT-006
  Scenario: Strength means offense, not the move Strength
    When I search for "strongest pokemon"
    Then the outcome is "results"
    And the first result is "pokemon:mewtwo"
    And "pokemon:alakazam" is within the first 2 results of its kind
    And the results exclude:
      | result        |
      | move:strength |

  @SRCH-CRIT-002 @SRCH-CRIT-006 @SRCH-PAGE-002
  Scenario: The base stat total ranks every Pokémon and ties break by number
    When I search for "best base stat total"
    Then the outcome is "results"
    And the first result is "pokemon:mewtwo"
    And "pokemon:dragonite" ranks before "pokemon:mew"

  @SRCH-CRIT-002 @SRCH-CRIT-003
  Scenario Outline: A low direction reverses the ranking without matching move names
    When I search for "<query>"
    Then the outcome is "results"
    And the first result is "<first>"
    And the results exclude:
      | result            |
      | move:low-kick     |
      | move:defense-curl |

    Examples:
      | query               | first           |
      | lowest hp pokemon   | pokemon:diglett |
      | low defense pokemon | pokemon:chansey |

  @SRCH-CRIT-001 @SRCH-CRIT-002
  Scenario: A stat without a direction word ranks from the highest
    When I search for "water pokemon hp"
    Then the outcome is "results"
    And every pokemon result has the type "water"
    And "pokemon:lapras" ranks before "pokemon:vaporeon"
    And "pokemon:vaporeon" is within the first 2 results of its kind

  @SRCH-CRIT-007 @should
  Scenario: Several stats combine through their percentile ranks
    When I search for "fast and strong electric pokemon"
    Then the outcome is "results"
    And every pokemon result has the type "electric"
    And these results appear in this order:
      | result             |
      | pokemon:jolteon    |
      | pokemon:zapdos     |
      | pokemon:electabuzz |
    And "pokemon:jolteon" ranks before "pokemon:electrode"

  @SRCH-CRIT-008 @should
  Scenario: "Over" is a strict comparison
    When I search for "electric pokemon with speed over 100"
    Then the outcome is "results"
    And the term "over" is recognized as comparator
    And the term "100" is recognized as number
    And the results include:
      | result             |
      | pokemon:electrode  |
      | pokemon:jolteon    |
      | pokemon:raichu     |
      | pokemon:electabuzz |
    And the results exclude:
      | result          |
      | pokemon:voltorb |
      | pokemon:zapdos  |
      | pokemon:pikachu |

  @SRCH-CRIT-008 @should
  Scenario: "At least" is an inclusive comparison
    When I search for "electric pokemon with speed at least 100"
    Then the outcome is "results"
    And the results include:
      | result          |
      | pokemon:voltorb |
      | pokemon:zapdos  |
    And the results exclude:
      | result          |
      | pokemon:pikachu |

  @SRCH-MOVE-001 @should
  Scenario: Strong means power for moves
    When I search for "strongest fire move"
    Then the outcome is "results"
    And every result is a move
    And these results appear in this order:
      | result            |
      | move:fire-blast   |
      | move:flamethrower |
      | move:fire-punch   |

  @SRCH-MOVE-001 @should
  Scenario: A damage class filters moves
    When I search for "physical electric moves"
    Then the outcome is "results"
    And there is 1 move result
    And the results include:
      | result             |
      | move:thunder-punch |

  @SRCH-MOVE-001 @should
  Scenario: Priority moves act first, not last
    When I search for "priority moves"
    Then the outcome is "results"
    And every result is a move
    And there are 2 move results
    And the results include:
      | result            |
      | move:quick-attack |
      | move:bide         |
    And the results exclude:
      | result       |
      | move:counter |
      | move:roar    |
