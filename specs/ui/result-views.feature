Feature: Present results in a view suited to each kind of question
  A name lookup, a comparison, an effect and a strategy do not call for the
  same presentation. The view follows the reading of the query, and every
  result says why it is there.

  Pitfalls:
  - A Pokémon found through a move must name that move, or the user cannot
    tell why it answers "put the opponent to sleep".
  - The same move can help and hurt: thunder benefits from rain and suffers in
    sun, so the weather view must not show it as a plain match.
  - Loading more results must keep the ones already read in place.

  Background:
    Given I open the Pokédex

  @SYS-UI-020
  Scenario: A result found through a relationship names the related entity
    When I search for "put the opponent to sleep"
    Then the result "pokemon:paras" shows the reason "Causes sleep, 100% chance through spore"
    And the reason of "pokemon:paras" links to "move:spore"

  @should @SYS-UI-008
  Scenario Outline: The results view follows the reading of the query
    When I search for "<query>"
    Then I see the <view> view

    Examples:
      | query                     | view        |
      | bulba                     | name        |
      | fast electric pokemon     | criteria    |
      | put the opponent to sleep | effect      |
      | rain team                 | weather     |
      | legendary pokemon         | exploration |

  @should @SYS-UI-008
  Scenario: The criteria view compares the ranking stat
    When I search for "fast electric pokemon"
    Then every Pokémon result shows its "speed" on a comparison bar

  @should @SYS-UI-008
  Scenario: The effect view shows the chance of success
    When I search for "put the opponent to sleep"
    Then the result "move:spore" shows a chance of "100%"
    And the result "move:hypnosis" shows a chance of "60%"

  @should @SYS-UI-008
  Scenario: The weather view separates benefits from drawbacks
    When I search for "sun team"
    Then the result "move:solar-beam" is marked as a benefit
    And the result "move:thunder" is marked as a drawback
    And the result "ability:drought" is marked as a setter

  @should @SYS-UI-017
  Scenario: A section appends its next page on request
    When I search for "fast pokemon"
    Then the "pokemon" section shows 20 of 151 results
    When I ask for more results in the "pokemon" section
    Then the "pokemon" section shows 40 of 151 results
    And the first result of the "pokemon" section is still "pokemon:electrode"

  @should @SYS-UI-016
  Scenario: A result opens in full, and its relations open in turn
    When I search for "pikachu"
    And I open the result "pokemon:pikachu"
    Then I see the details of "pokemon:pikachu"
    And the details list "ability:static"
    When I open the related "ability:static"
    Then I see the details of "ability:static"
    And the details list "pokemon:pikachu"

  @could @SYS-UI-009
  Scenario: The best match is presented as a collectible card
    When I search for "bulba"
    Then the best match "pokemon:bulbasaur" is a card with its artwork, genus and description

  @could @SYS-UI-010
  Scenario Outline: A weather strategy sets a matching ambience
    When I search for "<query>"
    Then the page ambience is "<weather>"

    Examples:
      | query          | weather   |
      | rain team      | rain      |
      | sun team       | sun       |
      | sandstorm team | sandstorm |

  @could @SYS-UI-011
  Scenario: A stat comparison overlays the profiles of selected Pokémon
    When I search for "fast electric pokemon"
    And I select "pokemon:jolteon" and "pokemon:raichu" for comparison
    Then I see the stat profiles of "pokemon:jolteon" and "pokemon:raichu" overlaid

  @could @SYS-UI-012
  Scenario: A weather strategy is a navigable graph of relations
    When I search for "rain team"
    Then the relation graph links "rain" to "ability:swift-swim"
    And the relation graph links "ability:swift-swim" to "pokemon:goldeen"
    When I select "ability:swift-swim" in the relation graph
    Then I see the details of "ability:swift-swim"

  @could @SYS-UI-013
  Scenario: The team tray holds six Pokémon and shows their shared weather
    When I search for "rain team"
    And I add "pokemon:goldeen", "pokemon:seaking", "pokemon:psyduck", "pokemon:golduck", "pokemon:horsea" and "pokemon:kabuto" to the team
    Then the team tray holds 6 Pokémon
    And the team tray shows that they share "rain"
    When I try to add "pokemon:omanyte" to the team
    Then the team tray still holds 6 Pokémon

  @could @SYS-UI-014
  Scenario: A query can be spoken and an entry read aloud
    Given the browser supports speech
    When I speak "bulba"
    Then the search box contains "bulba"
    When I ask to hear the entry of "pokemon:bulbasaur"
    Then the entry of "pokemon:bulbasaur" is read aloud
