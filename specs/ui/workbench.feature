Feature: Build a party and compare candidates across searches
  The party and the bench outlive a search: candidates found by different
  questions are compared side by side, a party is built, analysed and shared,
  and every change can be undone.

  Pitfalls:
  - Ctrl+Z in the search box must undo typing, not the last party change.
  - A confirmation before every removal slows the user down; an undo is
    faster and just as safe.
  - The dataset has no type chart: the analysis must not claim weaknesses or
    resistances it cannot know.
  - A suggestion that fills a gap must come from a real search, or it cannot
    be explained.

  Background:
    Given I open the Pokédex

  @should @SYS-UI-026 @SYS-UI-027
  Scenario: Removing a member is announced, undone and redone with the keyboard
    When I search for "rain team"
    And I add "pokemon:lapras" and "pokemon:seel" to the party
    And I remove "pokemon:lapras" from the party
    Then the party announces "Removed Lapras" with an undo action
    When I press the undo shortcut
    Then the party holds "pokemon:lapras" and "pokemon:seel"
    When I press the redo shortcut
    Then the party holds "pokemon:seel"
    And the party does not hold "pokemon:lapras"

  @should @SYS-UI-026
  Scenario: The undo shortcut in the search box only edits the text
    When I search for "rain team"
    And I add "pokemon:lapras" to the party
    And I press the undo shortcut in the search box
    Then the party holds "pokemon:lapras"

  @should @SYS-UI-027
  Scenario: The undo action of the announcement restores a cleared party
    When I search for "rain team"
    And I add "pokemon:lapras" and "pokemon:seel" to the party
    And I clear the party
    And I undo from the announcement
    Then the party holds "pokemon:lapras" and "pokemon:seel"

  @should @SYS-UI-028
  Scenario: The bench compares Pokémon found by different searches
    When I search for "fast electric pokemon"
    And I compare "pokemon:jolteon"
    And I search for "bulky pokemon"
    And I compare "pokemon:snorlax"
    Then the bench compares "pokemon:jolteon" and "pokemon:snorlax"
    And the bench names "pokemon:jolteon" the leader of "Speed"
    And the bench names "pokemon:snorlax" the leader of "HP"
    When I pin "pokemon:jolteon" as the reference
    Then the bench shows "pokemon:snorlax" at "-100" on "Speed"

  @should @SYS-UI-029
  Scenario: A full party offers to replace a member
    When I search for "rain team"
    And I add "pokemon:goldeen", "pokemon:seaking", "pokemon:psyduck", "pokemon:golduck", "pokemon:horsea" and "pokemon:kabuto" to the party
    And I try to add "pokemon:omanyte" to the party
    Then I am asked whom "pokemon:omanyte" replaces, with what each replacement gains and loses
    When I replace "pokemon:goldeen" with "pokemon:omanyte"
    Then the party holds "pokemon:omanyte"
    And the party does not hold "pokemon:goldeen"

  @should @SYS-UI-032
  Scenario: A shared address restores the party and the bench
    When I search for "rain team"
    And I add "pokemon:lapras" and "pokemon:seel" to the party
    And I compare "pokemon:lapras"
    And another visitor opens the address of the page
    Then the party holds "pokemon:lapras" and "pokemon:seel"
    And the bench compares "pokemon:lapras"

  @should @SYS-UI-032
  Scenario: A reload restores the party
    When I search for "rain team"
    And I add "pokemon:lapras" to the party
    And I reload the page without its address
    Then the party holds "pokemon:lapras"

  @could @SYS-UI-030
  Scenario: The party analysis reports only what the dataset knows
    When I search for "rain team"
    And I add "pokemon:lapras" and "pokemon:seel" to the party
    Then the party analysis ranks the speed of "pokemon:lapras" among 151 species
    And the party analysis lists the move types the party can learn
    And the party analysis shows whether it covers the role "Puts foes to sleep"

  @could @SYS-UI-031
  Scenario: A missing role proposes Pokémon found by a search for it
    When I search for "bulba"
    And I add "pokemon:bulbasaur" to the party
    Then the party lacks the role "Forces a switch"
    And every Pokémon proposed for "Forces a switch" is a result of "force a switch" outside the party

  @could @SYS-UI-033
  Scenario: An exported party imports back the same
    When I search for "rain team"
    And I add "pokemon:lapras" and "pokemon:seel" to the party
    And I export the party
    And I clear the party
    And I import the exported party
    Then the party holds "pokemon:lapras" and "pokemon:seel"

  @could @SYS-UI-033
  Scenario: An import names the species it cannot read
    When I import the party:
      """
      Lapras @ Leftovers
      Ability: Water Absorb

      Agumon
      """
    Then the party holds "pokemon:lapras"
    And the import names "Agumon" as unreadable

  @could @SYS-UI-034
  Scenario: A weather starts a party with its setter and its beneficiaries
    When I start a party from "sun"
    Then the party holds a setter of "sun"
    And every member of the party benefits from or sets "sun"

  @should @SYS-UI-035
  Scenario: Keyboard shortcuts search, move, add and compare
    When I search for "fast electric pokemon"
    And I press "j"
    Then the result "pokemon:electrode" has the focus
    When I press "t"
    Then the party holds "pokemon:electrode"
    When I press "c"
    Then the bench compares "pokemon:electrode"
    When I press "?"
    Then the keyboard shortcuts are listed
    When I press Escape
    And I press "/"
    Then the search box has the focus
