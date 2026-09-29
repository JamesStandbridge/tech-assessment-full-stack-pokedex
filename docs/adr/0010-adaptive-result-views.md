# 10. Adapt the results view to the reading of the query

- Status: accepted
- Date: 2026-09-30

## Context and problem statement

The four needs of the brief call for different answers: one Pokémon to
confirm, candidates to compare, a way to cause an effect, a strategy spanning
abilities, moves and Pokémon. A single list of cards serves none of them well.
The response already says how the query was read, in
`interpretation.alternatives`, so the interface can choose a view from it
instead of guessing from the text. SYS-UI-008 to SYS-UI-012 and SYS-UI-020
describe the views; this record fixes the rule that picks one and the states
of the screen.

## Considered options

1. One generic view for every query.
2. A view chosen from the words of the query in the browser.
3. A view chosen from the first plan of the interpretation, with a fixed
   precedence between constraints.

## Decision outcome

Option 3. The interface never reparses the query: the backend's reading is the
only source.

### Reading of a response

The reading comes from the first alternative plan, by the first rule that
holds:

| Reading | Rule | View |
|---|---|---|
| name | `name` or `dex_number` is set | Best match first, as a collectible card when it is a Pokémon; other matches below with their name tier |
| weather | `weather` is set | Ambience of the weather; abilities, moves and Pokémon grouped by weather role: setter, benefit, protection, mixed, drawback; relation graph with its list |
| effect | `effect` is set | Chance of success on every result; Pokémon show the move or ability they get the effect through |
| criteria | `stat_sort` or `stat_filters` is not empty | Comparison bars of the ranking stat, scaled to the highest value among the results shown, since the browser knows the response and not the dataset; stat profiles overlaid for selected Pokémon |
| exploration | none of the above | Result cards with their reasons |

The precedence follows specificity: a name designates entities, a weather or an
effect states a goal, and stats then order the candidates. "fast pokemon that
benefit from rain" is a weather reading whose results are also sorted by speed.
When the query has several readings, every one is named from
`interpretation.summary` (SYS-UI-018), and the view follows the first.

### States of the screen

| State | Entered when | Shows |
|---|---|---|
| home | the query is empty | the four kinds of question with an example each (SYS-UI-004) |
| typing | the user types at least two characters | terms as understood, suggestions (SYS-UI-005, SYS-UI-015) |
| loading | a search is sent | a loading state over the previous results, marked as outdated (SYS-UI-001) |
| results | the outcome is results | the view of the reading, notices, refinements (SYS-UI-008, SYS-UI-019, SYS-UI-006) |
| empty | the outcome is empty | the explanation and runnable suggestions (SYS-UI-023) |
| invalid | the API answers 400 | the API's message, with the input rule |
| failed | the request fails or the API answers 500 | a failure message and a retry action |

- A search runs 300 ms after the last keystroke and at once on Enter. Each new
  search cancels the previous request, and a response is shown only if its
  query is still the current one (SYS-UI-022).
- A search on pause replaces the current history entry; Enter, an example, a
  suggestion or a refinement pushes a new one, so going back returns to the
  previous deliberate search (SYS-UI-007).
- Input rules are not duplicated in the browser: an invalid query is sent and
  the API's message is shown, so the two sides cannot disagree.
- Opening a result shows its details in a dialog backed by
  `/api/entities/{kind}/{name}`; related entities open in the same dialog, and
  closing it returns the focus to the result (SYS-UI-016, SYS-A11Y-002).

### Visual language

Design tokens, as CSS variables, give each of the 18 types a colour, each term
role a colour shared by the term chips and the reasons, and each weather an
ambience. Charts and graphs are SVG with an equivalent list (SYS-A11Y-001),
and every movement goes through Motion, which the reduced motion preference
turns into fades (SYS-A11Y-003).

## Consequences

- A new kind of constraint in the backend falls back to the exploration view
  until a rule and a view are added; nothing breaks.
- The reading is a pure function of the response, tested without rendering.
- The interface depends on the plan fields of the contract, which are already
  covered by the OpenAPI validation of the acceptance suite.
