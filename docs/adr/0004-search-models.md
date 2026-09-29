# 4. Use one retrieval model per kind of constraint

- Status: accepted
- Date: 2026-09-29

## Context and problem statement

The search needs are different mathematical problems. A name lookup is about
spelling, a criteria search about attribute values, an intent search about
what an effect does to whom, and a strategy search about relations between
entities. A single query can also combine them, as in "water pokemon that can
put the opponent to sleep". The calibration in
`tooling/tests/unit/test_threshold_calibration.py` measured a naive full-text
search at a mean nDCG@10 of 0.55, against a threshold of 0.90.

## Considered options

1. One lexical score (BM25) over every text field.
2. Dense embeddings with cosine similarity as the primary retrieval method.
3. One model per kind of constraint, combined in a conjunctive plan.

## Decision outcome

Option 3.

| Constraint | Model | Ranking contribution |
|---|---|---|
| Name | Tiered string similarity | Exact, then prefix, then infix, then Damerau-Levenshtein distance within 1 (up to 5 characters) or 2 |
| Kind, type, characteristic, damage class | Boolean filters | None |
| Stat | Attribute filter and sort | Value of a base, derived or move stat; mean percentile rank for several stats |
| Effect | Match on extracted facts (effect, target, mode) | Probability of success: accuracy times effect chance; a Pokémon takes its best source |
| Weather | Weighted relation graph | Setters first, then the sum of 1 per benefit, 0.5 per protection or mixed effect and -0.5 per drawback, halved for moves; roles are judged for the weather queried |
| Relation | Graph lookup (learns, has) | None |
| Description words | BM25 over species descriptions, as an approximate fallback | BM25 score |

A query becomes a plan whose constraints intersect. The ranking follows the
stats the query asks for, then the effect or weather strength, then the dataset
id. Every formula was checked against the graded judgments before being written
into `specs/requirements.yaml`: the effect ranking reproduces the order of all
three judged intent queries, and the weather ranking scores nDCG@10 = 1.00 on
all four judged weather queries.

Only a truly ambiguous query, such as "psychic", produces several alternative
plans. Their results appear in one section per entity kind, and scores from
different plans are never added, because their scales are unrelated. If a
single merged list is ever needed, reciprocal rank fusion is the intended
method, since it uses ranks only.

## Consequences

- Relevance is explainable: each result carries the fact or relation that
  ranked it, which the reasons in the API expose.
- The effect model depends on extracting facts from effect texts. Short effects
  are regular enough for a rule lexicon; the extraction runs at indexing time.
- BM25 was rejected as the primary method because it ignores prefixes, typos,
  polarity and who is affected; it only serves descriptive words that no other
  constraint explains. Embeddings were rejected as the primary method because
  cosine similarity barely separates "cause sleep" from "prevent sleep", which
  the must requirements depend on.
