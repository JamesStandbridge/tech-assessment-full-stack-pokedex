Feature: Handle invalid, unsupported and ambiguous queries
  Invalid input is rejected explicitly. A valid query that nothing answers
  gets an explained empty outcome instead of weak matches. An ambiguous query
  covers every plausible reading.

  Pitfalls in the dataset:
  - Loose fuzzy matching turns "potion" into explosion, poison-gas or porygon,
    and "dormir" into dodrio.
  - "psychic" is both a type and a move name.

  @SRCH-INPUT-001 @SRCH-INPUT-002
  Scenario Outline: Invalid input is rejected
    When I search for "<query>"
    Then the outcome is "invalid"

    Examples:
      | case           | query                                                                                                                                                                                                     |
      | empty          |                                                                                                                                                                                                           |
      | one character  | a                                                                                                                                                                                                         |
      | 201 characters | which pokemon can put the opponent to sleep which pokemon can put the opponent to sleep which pokemon can put the opponent to sleep which pokemon can put the opponent to sleep which pokemon can put the |

  @SRCH-INPUT-001
  Scenario: Whitespace only is empty after trimming
    When I search for "   "
    Then the outcome is "invalid"

  @SRCH-EMPTY-001 @SRCH-EMPTY-002
  Scenario Outline: Nothing in the dataset answers the query
    When I search for "<query>"
    Then the outcome is "empty"
    And the response includes an explanation

    Examples:
      | case                         | query     |
      | gibberish                    | xyzzy     |
      | Pokémon outside the snapshot | chikorita |
      | a kind and nothing to search | pokemon   |
      | item, not in the snapshot    | potion    |
      | other language               | dormir    |

  @SRCH-INPUT-004 @SRCH-KIND-001
  Scenario: A natural question with an accent and punctuation is understood
    When I search for "Which Pokémon can put the opponent to sleep?"
    Then the outcome is "results"
    And every result is a pokemon
    And the results include:
      | result           |
      | pokemon:jynx     |
      | pokemon:paras    |
      | pokemon:gengar   |
    And the results exclude:
      | result          |
      | pokemon:snorlax |

  @SRCH-INPUT-004
  Scenario Outline: Hyphenated and plural vocabulary forms are understood
    When I search for "<query>"
    Then the outcome is "results"
    And every pokemon result has the type "<type>"
    And the results include:
      | result     |
      | <included> |

    Examples:
      | query                 | type     | included           |
      | electric-type pokemon | electric | pokemon:zapdos     |
      | FIRE TYPES            | fire     | pokemon:charmander |

  @SRCH-AMBIG-001
  Scenario: A word that is both a type and a move covers both readings
    When I search for "psychic"
    Then the outcome is "results"
    And the results include:
      | result           |
      | move:psychic     |
      | pokemon:alakazam |
      | pokemon:mewtwo   |
