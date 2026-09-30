Feature: Explain how a query can be asked
  The search field offers a guide to the four kinds of question: what to say,
  an example that runs, and what the search does not understand. The guide
  closes on its own and does not clear the search.

  Background:
    Given I open the Pokédex

  @should @SYS-UI-035
  Scenario: The query guide explains each kind of question and runs an example
    When I open the query guide
    Then I see the query guide
    And the query guide explains "Recover a name"
    And the query guide explains "Compare by criteria"
    And the query guide explains "Discover by effect"
    And the query guide explains "Explore a strategy"
    When I select the guide example "fast electric pokemon"
    Then the query guide is closed
    And the search box contains "fast electric pokemon"
    And I see results

  @should @SYS-UI-035
  Scenario: Escape closes the query guide and leaves the search
    When I search for "bulba"
    And I open the query guide
    And I press Escape
    Then the query guide is closed
    And the search box contains "bulba"
    And I see results

  @should @SYS-UI-023 @SYS-UI-035
  Scenario: An empty outcome links to the relevant part of the guide
    When I search for "xyzzy"
    And I open the query guide from the empty outcome
    Then the query guide explains "Recover a name"

  @should @SYS-UI-035
  Scenario: The shortcut list opens the query guide
    When I press "?"
    Then the keyboard shortcuts are listed
    When I open the query guide from the shortcuts
    Then I see the query guide
