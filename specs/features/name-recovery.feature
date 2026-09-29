Feature: Recover something partially remembered
  A trainer remembers only part of a name and wants to confirm the entity.

  Ranking: exact name, then names starting with the query, then names
  containing it, then names within a bounded edit distance when nothing
  matches literally.

  Pitfalls in the dataset:
  - Names contain other names: mew in mewtwo, abra in kadabra, paras in parasect.
  - Dataset order is not relevance: mewtwo (#150) comes before mew (#151).
  - Names drop punctuation: mr-mime, farfetchd, nidoran-f, nidoran-m.
  - Move names contain each other: thunder in thunderbolt, spore in stun-spore.

  @SRCH-NAME-001 @SRCH-NAME-003
  Scenario: A unique prefix finds the Pokémon
    When I search for "bulba"
    Then the outcome is "results"
    And the first result is "pokemon:bulbasaur"
    And the results exclude:
      | result             |
      | pokemon:bellsprout |
      | pokemon:butterfree |

  @SRCH-INPUT-003
  Scenario: Case and surrounding whitespace are ignored
    When I search for "  BULBA "
    Then the outcome is "results"
    And the first result is "pokemon:bulbasaur"

  @SRCH-NAME-002
  Scenario: An exact name outranks a longer name sharing its prefix
    When I search for "mew"
    Then the outcome is "results"
    And the first result is "pokemon:mew"
    And "pokemon:mewtwo" is within the first 2 results of its kind

  @SRCH-NAME-003
  Scenario: A name starting with the query outranks a name containing it
    When I search for "abra"
    Then the outcome is "results"
    And the first result is "pokemon:abra"
    And "pokemon:abra" ranks before "pokemon:kadabra"

  @SRCH-NAME-003
  Scenario: Every name sharing the prefix is a candidate
    When I search for "char"
    Then the outcome is "results"
    And "pokemon:charmander" is within the first 3 results of its kind
    And "pokemon:charmeleon" is within the first 3 results of its kind
    And "pokemon:charizard" is within the first 3 results of its kind

  @SRCH-NAME-002 @SRCH-AMBIG-001
  Scenario: A query naming two variants returns both first
    When I search for "nidoran"
    Then the outcome is "results"
    And "pokemon:nidoran-f" is within the first 2 results of its kind
    And "pokemon:nidoran-m" is within the first 2 results of its kind

  @SRCH-NAME-004
  Scenario Outline: Display spellings match dataset names
    When I search for "<query>"
    Then the outcome is "results"
    And the first result is "<expected>"

    Examples:
      | query      | expected          |
      | Mr. Mime   | pokemon:mr-mime   |
      | mr mime    | pokemon:mr-mime   |
      | farfetch'd | pokemon:farfetchd |

  @SRCH-NAME-003
  Scenario: The end of a name is enough when no name starts with the query
    When I search for "saur"
    Then the outcome is "results"
    And "pokemon:bulbasaur" is within the first 3 results of its kind
    And "pokemon:ivysaur" is within the first 3 results of its kind
    And "pokemon:venusaur" is within the first 3 results of its kind

  @SRCH-NAME-005
  Scenario Outline: A typo still finds the name
    When I search for "<query>"
    Then the outcome is "results"
    And the first result is "<expected>"

    Examples:
      | query    | expected          |
      | bulbsaur | pokemon:bulbasaur |
      | pikachuu | pokemon:pikachu   |
      | charizrd | pokemon:charizard |

  @SRCH-NAME-006 @should
  Scenario: A Pokédex number finds the Pokémon
    When I search for "#25"
    Then the outcome is "results"
    And the first result is "pokemon:pikachu"

  @SRCH-NAME-001 @SRCH-NAME-002
  Scenario: Move names are searchable and an exact move comes first
    When I search for "thunder"
    Then the outcome is "results"
    And the first result is "move:thunder"
    And the results include:
      | result              |
      | move:thunderbolt    |
      | move:thunder-shock  |
      | move:thunder-punch  |
      | move:thunder-wave   |

  @SRCH-NAME-001
  Scenario: Ability names are searchable
    When I search for "static"
    Then the outcome is "results"
    And the first result is "ability:static"
