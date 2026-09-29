Feature: Show how a query is understood and let the user steer it
  The interface reads the query back to the user while they type, offers the
  words it knows, and turns every adjustment into a query they can see, share
  and go back from.

  Pitfalls:
  - Terms the search ignores must look different from the ones it uses, or the
    user believes they were applied.
  - A refinement that changed the results but not the query text would make
    the page impossible to share or reload.
  - Typing fast must not flood the API, nor let a late answer to an old query
    replace the answer to the current one.

  Background:
    Given I open the Pokédex

  @should @SYS-UI-005
  Scenario: Terms are shown as they are understood while typing
    When I type "fast electric pokemon against brock" and pause
    Then I see the term "fast" understood as "stat"
    And I see the term "electric" understood as "type"
    And I see the term "pokemon" understood as "kind"
    And I see the term "brock" shown as ignored

  @should @SYS-UI-006
  Scenario: A refinement replaces the query with its canonical form
    When I search for "fast electric pokemon"
    And I apply the refinement "Without type electric"
    Then the search box contains "highest speed pokemon"
    And I see results

  @should @SYS-UI-007
  Scenario: The query lives in the page URL
    When I search for "rain team"
    Then the page URL holds the query "rain team"
    When I reload the page
    Then the search box contains "rain team"
    And I see results
    When I search for "bulba"
    And I go back
    Then the search box contains "rain team"

  @should @SYS-UI-015
  Scenario: A suggestion can be chosen with the keyboard
    When I type "pika" and pause
    Then I see the suggestion "pikachu (pokemon)"
    When I choose the suggestion "pikachu (pokemon)" with the keyboard
    Then the search box contains "pikachu"
    And I see results

  @should @SYS-UI-018
  Scenario: Every reading of an ambiguous query is named
    When I search for "psychic"
    Then I see the reading "of type psychic"
    And I see the reading "names matching 'psychic'"

  @should @SYS-UI-019
  Scenario: Notices are shown beside the results
    When I search for "fast electric pokemon against brock"
    Then I see the notice "Not understood, so ignored: against, brock."
    And I see results

  @should @SYS-UI-022
  Scenario: Typing sends one search per pause
    When I type "put the opponent to sleep" one character at a time and pause
    Then the search API received exactly one search
