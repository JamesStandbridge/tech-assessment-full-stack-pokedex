# 3. Follow the snapshot, and say what it lacks

- Status: accepted
- Date: 2026-09-29

## Context and problem statement

The published snapshot mixes eras. Moves are limited to Red, Blue and Yellow,
but types, stats and damage classes are modern, and every ability comes from
generation III or later. It also lacks mechanics that players associate with
the searches: there is no rain-setting move or ability, and nothing states that
rain boosts Water moves.

## Considered options

1. Correct the data with game knowledge, such as generation I types.
2. Follow the snapshot exactly and surface its gaps to the user.

## Decision outcome

Option 2.

- Types, stats and abilities are shown as the snapshot defines them: clefairy is
  Fairy, magnemite is Electric/Steel.
- The search never presents a fact absent from the snapshot. When a strategy
  depends on a missing mechanic, the response carries a notice instead.
- The preparation step verifies the published SHA-256 checksum, so every
  reviewer runs against the same data.

## Consequences

- Results are reproducible and auditable against one file.
- Some answers look wrong to generation I purists; the notices and the README
  explain why.
- Supplementing the data with another source stays possible later, as a
  separate decision.
