Feature: Keep every view accessible
  Visual extras never replace the plain information: every chart and graph has
  a list with the same results, the keyboard reaches everything, motion follows
  the user's preference, and nothing plays sound unasked.

  Pitfalls:
  - A drawn graph is unreadable to a screen reader and hard to reach with the
    keyboard.
  - Ink reveals, rain and morphing transitions can cause discomfort; the
    operating system setting for reduced motion must win.
  - An engraved plate drawn with WebGL must not be the only way to see the
    artwork: some browsers cannot draw it, and some users save data.
  - A narrow phone screen must not need horizontal scrolling.

  Background:
    Given I open the Pokédex

  @SYS-A11Y-001
  Scenario Outline: Every chart and graph has the same results as a list
    When I search for "<query>"
    Then the <visual> offers the same results as an accessible list

    Examples:
      | query                 | visual         |
      | fast electric pokemon | comparison     |
      | rain team             | relation graph |

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

  @could @SYS-UI-024
  Scenario Outline: The plain artwork replaces the engraving when it cannot or should not be drawn
    Given <condition>
    When I search for "bulba"
    Then the best match shows the plain artwork of "pokemon:bulbasaur"

    Examples:
      | condition                  |
      | the browser has no WebGL   |
      | I prefer reduced motion    |
      | I prefer to save data      |

  @could @SYS-UI-025
  Scenario: Opening a result morphs it into its details
    When I search for "pikachu"
    And I open the result "pokemon:pikachu"
    Then the result "pokemon:pikachu" morphed into its details

  @could @SYS-UI-025
  Scenario: Reduced motion opens the details without morphing
    Given I prefer reduced motion
    When I search for "pikachu"
    And I open the result "pokemon:pikachu"
    Then I see the details of "pokemon:pikachu"
    And no transition has morphed the page

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

  @should @SYS-UI-021
  Scenario: A narrow screen needs no horizontal scrolling
    Given a viewport 360 pixels wide
    When I search for "fast electric pokemon"
    Then the page does not scroll horizontally
    And I can open the result "pokemon:jolteon"
