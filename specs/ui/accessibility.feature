Feature: Keep every view accessible
  Visual extras never replace the plain information: every chart and graph has
  a list with the same results, the keyboard reaches everything, motion follows
  the user's preference, and nothing plays sound unasked.

  Pitfalls:
  - A scene drawn on a canvas is invisible to a screen reader and out of
    reach of the keyboard; its elements must exist in the page as well.
  - Camera flights and drifting particles can cause discomfort; the operating
    system setting for reduced motion wins until the user chooses otherwise.
  - A narrow phone screen must not need horizontal scrolling.
  - A theme applied once the application has loaded flashes the other one
    first; contrast must hold in both themes.

  Background:
    Given I open the Pokédex

  @SYS-A11Y-001
  Scenario Outline: Every chart and graph has the same results as a list
    When I search for "<query>"
    Then the <visual> offers the same results as an accessible list

    Examples:
      | query                 | visual         |
      | fast electric pokemon | comparison     |
      | rain team             | constellation  |

  @should @SYS-A11Y-002
  Scenario: The whole search works with the keyboard alone
    When I search for "pikachu" using only the keyboard
    And I open the result "pokemon:pikachu" using only the keyboard
    Then I see the details of "pokemon:pikachu"
    When I press Escape
    Then the focus returns to the result "pokemon:pikachu"

  @SYS-A11Y-003
  Scenario: Reduced motion leaves only fades
    Given I prefer reduced motion
    When I search for "rain team"
    Then nothing on the page moves beyond a fade

  @SYS-A11Y-004
  Scenario: Nothing plays sound without a user action
    When I search for "bulba"
    Then no sound has played

  @should @SYS-A11Y-002
  Scenario Outline: Every state has no detectable accessibility violation
    When I search for "<query>"
    Then the page has no accessibility violations

    Examples:
      | query                     |
      | bulba                     |
      | fast electric pokemon     |
      | put the opponent to sleep |
      | rain team                 |
      | xyzzy                     |

  @should @SYS-UI-036
  Scenario: Motion follows the system until the user chooses, and the choice is kept
    Given I prefer reduced motion
    Then the constellation is a still map
    And motion on the page is reduced
    When I choose animated motion
    Then motion on the page is full
    And the constellation is drawn with motion
    When I reload the page
    Then motion on the page is full
    And the constellation is drawn with motion
    When I choose still motion
    Then the constellation is a still map
    And motion on the page is reduced
    When I reload the page
    Then the constellation is a still map
    And motion on the page is reduced

  @should @SYS-UI-032
  Scenario: The theme follows the system until the user chooses one
    Given I prefer a dark color scheme
    Then the page is drawn in the dark theme
    When I choose the light theme
    And I reload the page
    Then the page is drawn in the light theme from its first paint

  @should @SYS-UI-032
  Scenario Outline: Each theme has no detectable accessibility violation
    Given I prefer a <theme> color scheme
    When I search for "<query>"
    Then the page is drawn in the <theme> theme
    And the page has no accessibility violations

    Examples:
      | theme | query                 |
      | dark  | bulba                 |
      | dark  | rain team             |
      | light | fast electric pokemon |
      | light | rain team             |

  @should @SYS-UI-021
  Scenario: A narrow screen needs no horizontal scrolling
    Given a viewport 360 pixels wide
    When I search for "fast electric pokemon"
    Then the page does not scroll horizontally
    And I can open the result "pokemon:jolteon"
