# 4. Use one retrieval model per kind of question

- Status: accepted
- Date: 2026-09-29

## Context and problem statement

The four search needs are different mathematical problems. A name lookup is
about spelling, a criteria search about attribute values, an intent search
about what an effect does to whom, and a strategy search about relations
between entities. The calibration in
`tooling/tests/unit/test_threshold_calibration.py` measured a naive full-text
search at a mean nDCG@10 of 0.55, against a threshold of 0.90.

## Considered options

1. One lexical score (BM25) over every text field.
2. Dense embeddings with cosine similarity as the primary retrieval method.
3. One model per reading of the query, each with its own ranking rule.

## Decision outcome

Option 3.

| Reading | Model | Ranking |
|---|---|---|
| Name | Tiered string similarity | Exact, then prefix, then infix, then Damerau-Levenshtein distance within 1 (up to 5 characters) or 2 |
| Criteria | Boolean filters and attribute sort | Value of a base or derived stat (total, bulk, offense); mean percentile rank for several stats; ties broken by dataset id |
| Effect | Match on extracted facts (effect, target, mode) | Probability of success: accuracy times effect chance; a Pokémon takes its best source |
| Weather | Weighted relation graph | Setters first, then the sum of 1 per benefit, 0.5 per mixed effect and -0.5 per drawback, halved for moves |

Every formula was checked against the graded judgments before being written
into `specs/requirements.yaml`: the effect ranking reproduces the order of all
three judged intent queries, and the weather ranking scores nDCG@10 = 1.00 on
all four judged weather queries.

Several readings of one query, such as "psychic", produce separate sections per
entity kind. Scores from different readings are never added, because their
scales are unrelated. If a single merged list is ever needed, reciprocal rank
fusion is the intended method, since it uses ranks only.

## Consequences

- Relevance is explainable: each result carries the fact or relation that
  ranked it, which the reasons in the API expose.
- The effect model depends on extracting facts from effect texts. Short effects
  are regular enough for a rule lexicon; the extraction runs at indexing time.
- BM25 was rejected because it ignores prefixes, typos, polarity and who is
  affected. Embeddings were rejected as the primary method because cosine
  similarity barely separates "cause sleep" from "prevent sleep", which the
  must requirements depend on. Both remain possible as additional recall
  layers behind the same contract.
