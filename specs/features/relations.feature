Feature: Follow a relation named inside a sentence
  An experienced trainer may ask about a specific move, ability or Pokémon
  within a sentence: who learns a move, who has an ability, or which moves a
  Pokémon learns.

  Entity names are detected inside the query, including names of several
  words, and the relation word decides which linked entities are returned.

  Pitfalls in the dataset:
  - 79 move names have several words, such as thunder-wave; "thunder" alone is
    another move.
  - Learnable moves include moves taught by machines; the snapshot does not
    say how a move is learned. pikachu learns surf here.

  @SRCH-LINK-001 @should
  Scenario: Pokémon that learn a move named in several words
    When I search for "pokemon that learn thunder wave"
    Then the outcome is "results"
    And the term "thunder wave" is recognized as name
    And the term "learn" is recognized as relation
    And every result is a pokemon
    And there are 30 pokemon results
    And the results include:
      | result            |
      | pokemon:pikachu   |
      | pokemon:electrode |
    And the results exclude:
      | result             |
      | pokemon:charmander |

  @SRCH-LINK-001 @should
  Scenario: Pokémon that have an ability
    When I search for "pokemon with levitate"
    Then the outcome is "results"
    And every result is a pokemon
    And there are 4 pokemon results
    And the results include:
      | result          |
      | pokemon:gastly  |
      | pokemon:haunter |
      | pokemon:koffing |
      | pokemon:weezing |

  @SRCH-LINK-001 @should
  Scenario: Moves that a Pokémon learns
    When I search for "moves learned by pikachu"
    Then the outcome is "results"
    And every result is a move
    And there are 30 move results
    And the results include:
      | result           |
      | move:thunderbolt |
      | move:surf        |
    And the results exclude:
      | result            |
      | move:flamethrower |

  @SRCH-LINK-001 @should
  Scenario: A requested stat ranks the Pokémon linked by a relation
    When I search for "fastest pokemon that learn thunder wave"
    Then the outcome is "results"
    And the first result is "pokemon:electrode"
    And "pokemon:jolteon" ranks before "pokemon:mewtwo"
