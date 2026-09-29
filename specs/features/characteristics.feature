Feature: Recover a Pokémon from a remembered characteristic
  A trainer may remember a characteristic instead of a name: what kind of
  creature it is, its color, where it lives, or that it is legendary.

  Genus words, colors, habitats, and legendary or mythical status filter
  Pokémon. Remaining descriptive words can match species descriptions, as an
  approximate reading.

  Pitfalls in the dataset:
  - Genus words are also type names: bug, dragon, electric, fairy, fire,
    poison and rock. The genus "Dragon Pokémon" includes horsea and seadra,
    which are Water type; "dragon" is read as the type.
  - "Mouse Pokémon" covers sandshrew and sandslash, not only the electric mice.
  - mew is mythical, not legendary.

  @SRCH-CHAR-001
  Scenario Outline: A characteristic filters Pokémon
    When I search for "<query>"
    Then the outcome is "results"
    And every result is a pokemon
    And there are <count> pokemon results
    And the results include:
      | result     |
      | <included> |

    Examples:
      | query           | count | included          |
      | fox pokemon     | 2     | pokemon:ninetales |
      | mouse pokemon   | 6     | pokemon:sandslash |
      | cave pokemon    | 8     | pokemon:onix      |
      | purple pokemon  | 23    | pokemon:gengar    |

  @SRCH-CHAR-001
  Scenario: Legendary excludes the mythical Mew
    When I search for "legendary pokemon"
    Then the outcome is "results"
    And there are 4 pokemon results
    And the results include:
      | result           |
      | pokemon:articuno |
      | pokemon:zapdos   |
      | pokemon:moltres  |
      | pokemon:mewtwo   |
    And the results exclude:
      | result      |
      | pokemon:mew |

  @SRCH-CHAR-001
  Scenario: A word that is both a genus and a type is read as the type
    When I search for "dragon pokemon"
    Then the outcome is "results"
    And there are 3 pokemon results
    And the results exclude:
      | result         |
      | pokemon:horsea |
      | pokemon:seadra |

  @SRCH-CHAR-001 @SRCH-PLAN-001
  Scenario: A characteristic and a type intersect
    When I search for "blue water pokemon"
    Then the outcome is "results"
    And every pokemon result has the type "water"
    And there are 16 pokemon results
    And the results include:
      | result         |
      | pokemon:lapras |
    And the results exclude:
      | result       |
      | pokemon:seel |

  @SRCH-CHAR-002 @could
  Scenario: Remembered description words find the Pokémon approximately
    When I search for "the one with a seed on its back"
    Then the outcome is "results"
    And the first result is "pokemon:bulbasaur"
    And the response includes an "approximate-match" notice
