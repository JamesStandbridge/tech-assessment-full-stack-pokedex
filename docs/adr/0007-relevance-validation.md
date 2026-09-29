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
3. Keep them as a consistency check, and add grades from a human assessor who
   grades pooled candidates without seeing ranks, scores or sources.

## Decision outcome

Option 3, following the pooling method of TREC evaluations.

- Rule judgments stay, as a regression guard for the ranking formulas.
- For every judged query, a pool gathers the candidates of several rankers:
  the rule judgments, a naive full-text search, and the live search service
  once it exists. `pool-assessments` writes them to
  `specs/relevance/assessments.yaml` in a deterministic shuffled order, with a
  neutral summary of each candidate and an empty grade.
- An assessor grades every candidate from 0 to 3 against the query alone.
  Anyone may add queries of their own to the file; they are pooled the same way.
- `evaluate-relevance` reports nDCG@10 against the assessor grades, and the
  agreement between assessor and rule grades as quadratic-weighted Cohen's
  kappa.
- The assessor threshold was fixed before any grading and before any
  implementation, and must not change after results are seen.

## Consequences

- The relevance claim no longer rests on the author's own formulas.
- Kappa shows where the rules diverge from human judgment, which points at the
  formulas to revisit.
- Grading needs a human: the current pool holds 346 candidates, about 30 to 45
  minutes of work. Until then the assessor evaluation reports that it has not
  run instead of passing.
- Pools grow when a new ranker contributes candidates; existing grades are
  kept, and only new candidates need grading.
