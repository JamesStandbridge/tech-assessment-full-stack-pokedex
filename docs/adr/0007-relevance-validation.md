# 7. Validate relevance against blind assessments of pooled candidates

- Status: accepted
- Date: 2026-09-29

## Context and problem statement

The graded judgments in `specs/relevance/judgments.yaml` were derived from the
same rules as the ranking formulas: speed bands for speed queries, success
probability for effect queries. A ranking that applies the formulas scores
nDCG = 1.00 against them by construction. They prove that the implementation
is consistent with its rules, not that the rules match what users want.

## Considered options

1. Keep the rule judgments as the only relevance measure.
2. Replace them with hand-written judgments by the same author.
3. Keep them as a consistency check, and add grades from an assessor who grades
   pooled candidates without seeing ranks, scores, sources or rules.

## Decision outcome

Option 3, following the pooling method of TREC evaluations.

- Rule judgments stay, as a regression guard for the ranking formulas.
- For every judged query, a pool gathers the candidates of several rankers:
  the rule judgments, a naive full-text search, and the live search service
  once it exists. `pool-assessments` writes them to
  `specs/relevance/assessments.yaml` in a deterministic shuffled order, with a
  neutral summary of each candidate and an empty grade.
- An assessor grades every candidate from 0 to 3 against the query alone. The
  assessor is a human, or a language model disclosed by name, working without
  access to the rules. Assessors may add queries of their own; they are pooled
  the same way.
- `evaluate-relevance` reports nDCG@10 against the assessor grades, the
  agreement between assessor and rule grades as quadratic-weighted Cohen's
  kappa, and the candidates graded two or more apart.
- Those disagreements are adjudicated by a human. Adjudication never edits the
  assessor's grades: it either corrects the rules, or records the assessor's
  error.
- The assessor threshold was fixed before any grading and before any
  implementation, and must not change after results are seen.

## Consequences

- The relevance claim no longer rests on the author's own formulas.
- A model assessor breaks the circularity but can have biases of its own and
  uses game knowledge beyond the dataset; a human review of the disagreements
  compensates, and the README states who graded.
- The first assessment was made by a language model agent (Grok 4.5 in
  Cursor) on 456 candidates. Against the rule grades, kappa was 0.81, and a
  ranking applying the rules exactly would score a mean nDCG@10 of 0.99
  against the assessor. Adjudicating its ten wide disagreements corrected two
  rules (harvest depends on sun through its long effect; dry-skin is a benefit
  for rain and a drawback only for sun), which raised kappa to 0.84, and
  recorded one assessor error
  (tentacool and tentacruel, holders of rain-dish, graded 0 for "pokemon that
  benefit from rain"), and kept one deliberate divergence: the assessor rates
  Water types without a rain ability as useful for rain, a fact the dataset
  does not state.
- Pools grow when a new ranker contributes candidates; existing grades are
  kept, and only new candidates need grading.
