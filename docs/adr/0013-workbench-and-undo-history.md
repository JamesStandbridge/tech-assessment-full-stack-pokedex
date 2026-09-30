# 13. Keep the party and the bench in one workbench with an undo history

- Status: accepted
- Date: 2026-09-30

## Context and problem statement

Comparing candidates and building a party span several searches: a fast
electric Pokémon is found by one query, a bulky one by another. The first
interface kept the comparison inside the criteria view and the team in memory,
so both were lost on the next question or on reload; a full team refused new
members without a word, and removals could not be undone.

Competing tools show what users expect: live analysis without an "analyse"
button and templates by weather (Pokestats), verdicts and a winner per stat
(PokeTools), the gains and losses of swapping A for B (PartyDex), roles to fill
(Smogon's role compendium), text import and export (Showdown), and shareable
links (Pikalytics, PokéKit).

## Decision outcome

### One state, one history

- The workbench is one domain value: the party (up to six Pokémon), the bench
  (up to four) and an optional reference. A pure reducer applies a
  discriminated union of actions, with an exhaustive switch.
- A generic history keeps past, present and future states, capped at fifty,
  each entry labelled in words such as "Removed Lapras".
- Two histories stay distinct. The browser's history belongs to searches, as
  ADR 10 decided. Ctrl+Z or Cmd+Z undoes workbench changes, and is ignored in
  text fields so the search box keeps its own undo. The workbench is written to
  the address with `replace`, never `push`, so Back never undoes a party
  change.
- No confirmation precedes a removal, a replacement or a clear: an
  announcement with an undo action follows it, in a polite live region, and
  stays while it is focused or hovered.
- The address and local storage hold the workbench, so a shared link or a
  reload restores it.

### Analysis from facts the dataset holds

The snapshot has no type chart, so the analysis claims no weakness,
resistance or effectiveness (OUT-003). It reports:

- the stat profile of the party on the shared scale, and its balance between
  physical and special attack;
- its types, with repeated ones marked;
- the speed rank of every member among the 151 species, from the search
  "fast pokemon";
- the types of the damaging moves the party can learn, from the search
  "strong moves" and the learnsets of the details;
- the weathers every member helps with, from the four weather searches;
- the roles it covers, each defined as a search: a member covers a role when
  it learns a move or has an ability of that search's results.

A missing role proposes the Pokémon of the same search, members excluded, so
every suggestion is explained by the search engine rather than by usage
statistics the product does not have.

## Consequences

- The analysis costs a few cached searches and one details request per
  member; TanStack Query shares them across the page.
- Role and weather definitions are data of the domain, tested against the
  real API by interface scenarios, so a change to the vocabulary that breaks a
  role fails a scenario.
- The Showdown export only carries species and abilities; items, natures and
  spreads do not exist in the dataset.
