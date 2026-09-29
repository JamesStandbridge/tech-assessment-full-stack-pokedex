Feature: Combine constraints in one query
  A query can mix a kind of entity, types, characteristics, stats, an effect,
  a weather and a relation. Constraints intersect: every result satisfies all
  of them. The ranking follows the stats the query asks for, and otherwise the
  strength of its effect or weather relation.

  Pitfalls:
  - Treating each constraint as a separate reading returns the union: 32
    Pokémon that can cause sleep plus 32 Water Pokémon, instead of the four
    Water Pokémon that can cause sleep.
  - "pokemon", "moves" and "abilities" name a kind of result; they are not
    filler words.
  - Stats apply to Pokémon only, and types to Pokémon and moves; abilities have
    neither.

  @SRCH-PLAN-001 @SRCH-PLAN-002 @SRCH-KIND-001
  Scenario: A type and an effect intersect
    When I search for "water pokemon that can put the opponent to sleep"
    Then the outcome is "results"
    And every result is a pokemon
    And there are 4 pokemon results
    And these results appear in this order:
      | result            |
      | pokemon:poliwag   |
      | pokemon:poliwhirl |
      | pokemon:poliwrath |
      | pokemon:lapras    |

  @SRCH-PLAN-001 @SRCH-PLAN-002 @SRCH-STRAT-007
  Scenario: A type and a weather intersect, with setters first
    When I search for "fire pokemon for a sun team"
    Then the outcome is "results"
    And every result is a pokemon
    And there are 5 pokemon results
    And these results appear in this order:
      | result             |
      | pokemon:vulpix     |
      | pokemon:ninetales  |
      | pokemon:charmander |
      | pokemon:charmeleon |
      | pokemon:charizard  |

  @SRCH-PLAN-001 @SRCH-PLAN-002
  Scenario: A requested stat ranks the entities that satisfy an effect
    When I search for "fastest pokemon that can paralyze the opponent"
    Then the outcome is "results"
    And every result is a pokemon
    And the first result is "pokemon:electrode"
    And "pokemon:jolteon" ranks before "pokemon:pikachu"

  @SRCH-PLAN-001
  Scenario: A stat constraint leaves out kinds without stats
    When I search for "fastest electric"
    Then the outcome is "results"
    And every result is a pokemon
    And the first result is "pokemon:electrode"

  @SRCH-KIND-001 @SRCH-CRIT-001
  Scenario: A kind word restricts the results to moves
    When I search for "electric moves"
    Then the outcome is "results"
    And every result is a move
    And there are 5 move results
    And the results include:
      | result             |
      | move:thunder-punch |
      | move:thunder-shock |
      | move:thunderbolt   |
      | move:thunder-wave  |
      | move:thunder       |

  @SRCH-KIND-001 @SRCH-INTENT-001
  Scenario: A kind word restricts an effect to abilities
    When I search for "sleep abilities"
    Then the outcome is "results"
    And every result is an ability
    And the results include:
      | result               |
      | ability:effect-spore |

  @SRCH-CRIT-001
  Scenario: A type without a kind word covers Pokémon and moves
    When I search for "electric"
    Then the outcome is "results"
    And every pokemon result has the type "electric"
    And the results include:
      | result           |
      | pokemon:pikachu  |
      | move:thunderbolt |
