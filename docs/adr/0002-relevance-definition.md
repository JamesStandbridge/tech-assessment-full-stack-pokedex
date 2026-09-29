# 2. Define relevance per need, from the data

- Status: accepted
- Date: 2026-09-29

## Context and problem statement

The brief asks for a definition of relevance that tests make observable. A
single text-similarity score cannot serve all four needs: a name lookup is
about spelling, a criteria search about stats, an intent search about what an
effect does to the target, and a strategy search about relationships between
entities.

## Considered options

1. One text-similarity score over every field.
2. A relevance rule per need, grounded in structured fields where they exist.

## Decision outcome

Option 2.

- Name recovery: exact name, then prefix, then infix, then bounded typo
  tolerance, which applies only when nothing matches literally.
- Criteria comparison: types filter as an intersection, speed adjectives rank by
  base speed. Criteria words are never matched against text.
- Intent discovery: effect words match short effects only. Effects on the user,
  requirements and preventions are not answers. Guaranteed effects rank before
  chance-based ones, then by accuracy.
- Strategy exploration: weather words match as whole words, in short and long
  effects, through a small weather vocabulary. Results are labelled as benefits
  or drawbacks. Pokémon are reached through abilities and learnable moves.

## Consequences

- Long effects are excluded from intent matching because they cite mechanics
  outside the snapshot; nine moves mention sleep only through Sleep Talk.
- Weather matching reads long effects because thunder's rain accuracy only
  appears there. The whole-word rule contains the resulting noise.
- Every result carries the reason it matched, so relevance is visible to users
  as well as tests.
- Moves learned by almost every Pokémon, such as rest and substitute, carry
  little information; relations through them must not dominate rankings.
