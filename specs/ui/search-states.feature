Feature: Show every state of a search
  The interface always says what is happening: nothing searched yet, a search
  in progress, results, nothing found, an invalid query or a failure. Each state
  has its own message and its own way forward.

  Pitfalls:
  - A slow response must not leave earlier results looking current.
  - An empty outcome and a failure call for different remedies: rephrasing the
    query, or retrying the request.
  - Artwork comes from a remote host that may be unreachable.

  Background:
    Given I open the Pokédex

  @SYS-UI-004
  Scenario: The home screen presents the four kinds of question
    Then I see an example for each kind of question:
      | question                | query                     |
      | Recover a name          | bulba                     |
      | Compare by criteria     | fast electric pokemon     |
      | Discover by effect      | put the opponent to sleep |
      | Explore a strategy      | rain team                 |

  @SYS-UI-004
  Scenario: Selecting an example runs its query
    When I select the example "put the opponent to sleep"
    Then the search box contains "put the opponent to sleep"
    And I see results

  @SYS-UI-001
  Scenario: A search in progress shows a loading state
    Given the search API responds slowly
    When I search for "rain team"
    Then I see a loading state
    And I eventually see results

  @SYS-UI-002 @SYS-UI-023
  Scenario: An empty outcome is explained and offers suggestions that run
    When I search for "xyzzy"
    Then I see the message for an empty outcome
    And I see the explanation "No Pokémon, move or ability in this dataset is named like 'xyzzy'."
    When I select the suggestion "Try 'bulba'"
    Then the search box contains "bulba"
    And I see results

  @SYS-UI-002
  Scenario: An invalid query gets its own message
    When I search for "a"
    Then I see the message for an invalid query

  @SYS-UI-002
  Scenario: A failed request gets its own message and can be retried
    Given the search API is unreachable
    When I search for "pikachu"
    Then I see the message for a failed request
    When the search API is reachable again
    And I retry the search
    Then I see results

  @SYS-UI-003
  Scenario: Missing artwork shows a placeholder and the page stays usable
    Given entity images cannot be loaded
    When I search for "pikachu"
    Then the result "pokemon:pikachu" shows an image placeholder
    And I can open the result "pokemon:pikachu"
