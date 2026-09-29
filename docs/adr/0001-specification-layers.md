# 1. Specify search behaviour in three layers

- Status: accepted
- Date: 2026-09-29

## Context and problem statement

The product targets four search needs, from name lookup to weather strategy.
Development is test-driven, so expected behaviour must be written before any
implementation exists and must stay independent of the stack. Search behaviour
mixes two kinds of claims: hard rules, such as "rest never answers a request to
put the target to sleep", and ranking quality, such as "spore is a better
answer than sing".

## Considered options

1. One JSON fixture holding every case and assertion.
2. Gherkin scenarios only.
3. Three layers: EARS requirements, Gherkin scenarios for hard rules, graded
   relevance judgments for ranking quality.

## Decision outcome

Option 3.

- `specs/requirements.yaml` states each requirement once, with an EARS template
  and a stable identifier.
- `specs/features/*.feature` holds pass-or-fail scenarios. Each scenario is
  tagged with the requirements it verifies.
- `specs/relevance/judgments.yaml` grades results from 1 to 3, in the style of
  TREC relevance judgments. `specs/relevance/thresholds.yaml` sets the nDCG and
  reciprocal rank targets.
- `specs/api/openapi.yaml` is the contract the scenarios and the frontend rely on.
- `specs/schemas/` validates the specification files and the dataset.

## Consequences

- Scenarios are readable without the code and executable once step definitions
  exist.
- Ranking can improve without editing tests, as long as thresholds hold.
- Traceability is checked from tags: every requirement verified by acceptance
  needs at least one scenario, and every tag must name a known requirement.
- A single fixture was rejected because it mixes hard rules with ranking
  quality and cannot express graded relevance. Gherkin alone was rejected for
  the same reason.
- Keeping judgments exhaustive is manual work. Each query records the rule its
  grades were derived from, so they can be regenerated from the dataset.
