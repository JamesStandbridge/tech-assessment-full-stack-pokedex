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

## Amendment of 2026-09-29: frozen sheet and condensed nDCG

### Context

Pooling after every change to the engine added new ungraded candidates, which
counted as grade 0, and each grading round came with new assessor queries that
led to further changes. The loop did not converge. It also exposed a defect:
`pool-assessments` rebuilt each pool from the current rankers, so a candidate
no ranker proposed anymore was dropped with its grade. Seventeen grades were
lost this way, eight of them positive.

### Decision

- The sheet is frozen on 2026-09-29: `frozen_on` is set, and
  `pool-assessments` refuses to change a frozen sheet. No query and no
  candidate is added afterwards.
- Pools now keep every earlier candidate. The seventeen lost grades were
  restored from git history with their last recorded value.
- Scores against the assessor use condensed nDCG@10: unjudged results are
  removed from the ranking before the cutoff instead of counting as
  irrelevant, and every query with at least one grade is scored. The report
  gives the share of the leading results that are judged, so an unjudged
  ranking remains visible.
- The pre-registered minimum of 0.80 is unchanged.

### Consequences

- Once frozen, the measure only moves when the engine does.
- Condensed nDCG rewards nothing it cannot see: a kind whose leading results
  are all unjudged scores 0 when no judged relevant result is retrieved.
- Queries Q-USER-06 to Q-USER-14 were added by the assessor after the engine
  existed, and their failures led to fixes: healing and forced switches, type
  immunities, stat changes, move priority, shared chances of alternative
  effects, and ties broken by the number of sources. They are regression
  evidence, not an independent measure.
- On the frozen sheet, the mean condensed nDCG is 0.846 with 94% of leading
  results judged, and kappa against the rule grades is 0.833.
- Grades still to adjudicate: assessor grades given to kinds a query excludes,
  such as abilities for tanky water pokemon; clefairy and clefable graded 0 for
  freeze the opponent while nidorino and squirtle, which learn the same freezing
  moves, are graded 2; and starmie, tentacool and tentacruel.
