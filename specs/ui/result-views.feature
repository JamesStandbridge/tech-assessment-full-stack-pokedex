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
  Scenario: The best match comes to the front of the constellation
    When I search for "bulba"
    Then the best match "pokemon:bulbasaur" shows its artwork, genus and description
    And the constellation brings "pokemon:bulbasaur" to the front

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
  Scenario: A stat ranking aligns the results on an axis of that stat
    When I search for "fast electric pokemon"
    Then the constellation aligns the results on the "Speed" axis
    And the constellation places "pokemon:electrode" first on that axis

  @could @SYS-UI-011
  Scenario: A stat comparison overlays the profiles of selected Pokémon
    When I search for "fast electric pokemon"
    And I select "pokemon:jolteon" and "pokemon:raichu" for comparison
    Then I see the stat profiles of "pokemon:jolteon" and "pokemon:raichu" overlaid

  @could @SYS-UI-012
  Scenario: A weather strategy arranges the Pokémon in rings around the weather
    When I search for "rain team"
    Then the constellation places "pokemon:goldeen" in the ring of "Benefit"
    And the constellation links "rain" to "ability:swift-swim"
    And the constellation links "ability:swift-swim" to "pokemon:goldeen"
    When I focus "ability:swift-swim" in the constellation
    Then the constellation highlights "ability:swift-swim" and "pokemon:goldeen"
    When I select "ability:swift-swim" in the constellation
    Then I see the details of "ability:swift-swim"

  @could @SYS-UI-013
  Scenario: The party holds six Pokémon and shows their shared weather
    When I search for "rain team"
    And I add "pokemon:goldeen", "pokemon:seaking", "pokemon:psyduck", "pokemon:golduck", "pokemon:horsea" and "pokemon:kabuto" to the party
    Then the party holds 6 Pokémon
    And the party shows that they share "rain"

  @could @SYS-UI-024
  Scenario: The species form a constellation that follows the query
    Then the constellation shows 151 species
    When I search for "put the opponent to sleep"
    Then the constellation gathers the carriers of "move:spore" around it

  @could @SYS-UI-025
  Scenario Outline: A constellation that cannot move smoothly becomes a still map
    Given <condition>
    When I search for "rain team"
    Then the constellation is a still map
    And the constellation links "ability:swift-swim" to "pokemon:goldeen"

    Examples:
      | condition                    |
      | the browser has no WebGL     |
      | I prefer reduced motion      |
      | I prefer to save data        |

  @could @SYS-UI-033
  Scenario: The constellation can be explored by hand
    Given I prefer reduced motion
    When I search for "rain team"
    And I drag the constellation by 120 and 80 pixels
    Then the stars have moved by 120 and 80 pixels
    When I zoom into the constellation at "ability:swift-swim"
    Then the stars of the constellation spread apart
    When I recenter the constellation
    Then the stars are back in place
    When I point at "ability:swift-swim" in the constellation
    Then the constellation highlights "ability:swift-swim" and "pokemon:goldeen"
    When I click "ability:swift-swim" in the constellation
    Then I see the details of "ability:swift-swim"
