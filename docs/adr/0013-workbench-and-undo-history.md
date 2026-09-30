# 13. Keep the party and the bench in one state with an undo history

- Status: accepted
- Date: 2026-09-30

## Context and problem statement

Comparing candidates and building a party span several searches: a Pokémon
found by "fast electric pokemon" is compared with one found by "bulky
pokemon", then added to a party started from "rain team". The team tray of
ADR 10 lived in React state, lost itself on reload, failed silently when full
and asked nothing before a removal it could not take back.

## Considered options

1. Where the state lives: component state, the page address, or local
   storage.
2. How a mistake is recovered: a confirmation before every destructive action,
   or an undo after it.
3. How undo relates to the browser: one history for searches and changes, or
   two.

## Decision outcome

One pure reducer in `domain/workbench.ts` over a union of actions holds the
party of at most six and the bench of at most four with its reference, and a
generic `History<T>` in `domain/history.ts` keeps labelled past and future
states, at most 50.

- **Two histories.** The browser's Back navigates between searches, as ADR 10
  decided for the query. Undo, bound to Ctrl+Z and Cmd+Z outside text fields,
  reverts changes to the workbench. The workbench is written to the address
  with `replace`, never `push`, so the two never mix.
- **Undo instead of confirmation.** Removing, replacing or clearing takes
  effect at once and is announced in a polite live region with an Undo action,
  which stays while it has the focus or the pointer.
- **Address first, device second.** `?party=`, `?compare=` and `?ref=` make a
  workbench shareable; local storage restores it on a reload without them.
  Names read from either are validated before use.
- **Names only.** The workbench stores dataset names; stats, sprites and moves
  come from the entity API through the cache of TanStack Query.
- **A full party asks whom to replace**, with the signed stat differences and
  the types each replacement brings or removes.

## Consequences

- The reducer and the history are pure and fully unit tested; the context only
  exposes named intents, never a dispatch function.
- Shared weathers are computed from the four weather searches rather than
  from the search a member was added from, so they hold whatever search the
  party was built across.
- The dataset has no type chart (OUT-003), so the bench and the party report
  stats and types, never weaknesses or resistances.
