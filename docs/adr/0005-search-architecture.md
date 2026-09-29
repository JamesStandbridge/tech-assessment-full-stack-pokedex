# 5. Separate query understanding, indexing and ranking behind ports

- Status: accepted
- Date: 2026-09-29

## Context and problem statement

The dataset holds 429 entities, but the design must answer how search would
work with a million Pokémon without rebuilding the product. The interface also
needs the query's interpretation as data: term roles, a canonical query and
refinements.

## Considered options

1. A search function that reads the dataset and ranks directly.
2. A pipeline with explicit stages, where only the index depends on volume.
3. An external search engine from the start.

## Decision outcome

Option 2.

```text
indexing (offline)   snapshot -> EffectClassifier -> enriched documents -> SearchIndex
query (online)       text -> QueryParser -> SearchPlan -> SearchIndex -> Ranker -> sections
```

- `EffectClassifier` turns effect texts into facts: effect, target, mode,
  probability, weather and role. The first implementation is a versioned rule
  lexicon. Any replacement, such as a batch language model, must produce the
  same facts.
- Relations are denormalized at indexing time: each Pokémon carries the facts
  it can reach through its moves and abilities, with their sources. Effect and
  weather queries become filters and sorts, not joins.
- `QueryParser` turns text into a typed `SearchPlan` and reports the role of
  every term. It depends on small vocabularies only, never on data volume. A
  serializer turns a plan back into its canonical query, and
  `parse(serialize(plan)) == plan` is a tested property.
- `SearchIndex` is the only port that changes with scale. It exposes name
  matching, filtered sorts with cursors, and facet counts. The first adapter
  keeps everything in memory.
- `Ranker` applies the models of ADR 4 and builds the reasons.
- Notices about missing mechanics come from facet counts, not from hard-coded
  text, so they stay true if the data changes.
- Cursors are opaque, stateless and bound to the query, the section and the
  dataset version.

## Consequences

- Scaling means another `SearchIndex` adapter: PostgreSQL with `pg_trgm` and
  composite indexes, or OpenSearch with n-grams and function scores. The
  parser, the ranking rules and the API contract stay the same.
- The API is stateless and can be replicated; identical queries can be cached
  by dataset version.
- An external engine now would add infrastructure for no gain at 429 entities,
  and would make local review harder.
