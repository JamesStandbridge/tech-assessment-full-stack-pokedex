Feature: Know what can be searched and see how a query was understood
  A user must be able to tell which words the search understood and how, so
  that a partly understood query never looks fully answered.

  Every term is reported with the role it was recognized in, or as ignored. A
  term may span several words, such as "sp atk" or "at least".
  A query that names one entity identifies it as the best match.

  Pitfalls:
  - Silently dropping "against brock" would make a rain search look like an
    answer to a question about a gym leader.
  - A prefix shared by several names, such as "char" or "nidoran", has no
    single best match.
  - An exact name wins even when it is the prefix of another: "mew" and "mewtwo".
  - "rain" and "sleep" also start the names rain-dish and sleep-powder; the
    weather and effect readings are what the user means.

  @SRCH-TERM-001
  Scenario Outline: Each term is reported with its role
    When I search for "<query>"
    Then the term "<term>" is recognized as <role>

    Examples:
      | query                     | term      | role           |
      | bulba                     | bulba     | name           |
      | fast electric pokemon     | fast      | stat           |
      | fast electric pokemon     | electric  | type           |
      | fast electric pokemon     | pokemon   | kind           |
      | electric moves            | moves     | kind           |
      | fox pokemon               | fox       | characteristic |
      | legendary pokemon         | legendary | characteristic |
      | high attack pokemon       | high      | direction      |
      | high attack pokemon       | attack    | stat           |
      | highest sp atk pokemon    | sp atk    | stat           |
      | put the opponent to sleep | sleep     | effect         |
      | put the opponent to sleep | opponent  | target         |
      | prevent sleep             | prevent   | mode           |
      | rain team                 | rain      | weather        |
      | rain team                 | team      | filler         |

  @SRCH-TERM-001
  Scenario: Terms outside the vocabulary are reported as ignored
    When I search for "rain team against brock"
    Then the outcome is "results"
    And the term "rain" is recognized as weather
    And the term "against" is ignored
    And the term "brock" is ignored
    And the response notes that some terms were ignored

  @SRCH-TERM-001 @SRCH-EMPTY-001
  Scenario: A query with no recognized term says so
    When I search for "xyzzy"
    Then the outcome is "empty"
    And the term "xyzzy" is ignored
    And the response notes that some terms were ignored
    And the response includes an explanation

  @SRCH-BEST-001 @should
  Scenario Outline: A query naming one entity identifies it as the best match
    When I search for "<query>"
    Then the best match is "<entity>"

    Examples:
      | query    | entity            |
      | bulba    | pokemon:bulbasaur |
      | mew      | pokemon:mew       |
      | Mr. Mime | pokemon:mr-mime   |
      | thunder  | move:thunder      |

  @SRCH-BEST-001 @should
  Scenario Outline: A query naming several entities has no best match
    When I search for "<query>"
    Then there is no best match

    Examples:
      | query                 |
      | char                  |
      | nidoran               |
      | fast electric pokemon |
