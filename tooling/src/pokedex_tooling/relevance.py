"""Score search rankings against graded judgments and relevance thresholds."""

import argparse
import math
import os
import sys
from collections.abc import Mapping, Sequence
from statistics import fmean
from typing import Literal

from pydantic import BaseModel

from pokedex_tooling.client import (
    API_URL_VARIABLE,
    DEFAULT_API_URL,
    SearchApiUnavailableError,
    SearchClient,
    SearchOutcome,
)
from pokedex_tooling.contract import ContractValidator, ContractViolationError
from pokedex_tooling.entities import EntityKind, EntityRef
from pokedex_tooling.specs import (
    AssessmentsDocument,
    JudgedQuery,
    JudgmentsDocument,
    ThresholdsDocument,
    load_assessments,
    load_judgments,
    load_thresholds,
)

DISAGREEMENT_GAP = 2


class KindScore(BaseModel):
    """Metrics for the results of one kind, for one judged query."""

    query_id: str
    query: str
    need: str
    kind: EntityKind
    ndcg: float
    reciprocal_rank: float | None
    ranking: list[str]


class ThresholdFailure(BaseModel):
    """A metric value below its minimum."""

    scope: str
    metric: str
    value: float
    minimum: float


class RelevanceReport(BaseModel):
    """Scores for every judged query and kind, with the thresholds they break."""

    scores: list[KindScore]
    mean_ndcg: float
    failures: list[ThresholdFailure]

    @property
    def passed(self) -> bool:
        """Tell whether every threshold holds."""
        return not self.failures


def gain(grade: int) -> float:
    """Return the exponential gain of a grade."""
    return float(2**grade - 1)


def dcg(grades: Sequence[int]) -> float:
    """Return the discounted cumulative gain of grades in rank order."""
    return sum(gain(grade) / math.log2(position + 2) for position, grade in enumerate(grades))


def ndcg(ranking: Sequence[str], grades: Mapping[str, int], cutoff: int) -> float:
    """Return nDCG at the cutoff; unjudged names have grade 0.

    Args:
        ranking: Names in rank order.
        grades: Grade per judged name, at least one of them positive.
        cutoff: Number of leading positions considered.

    Returns:
        A value between 0 and 1.
    """
    ideal = dcg(sorted(grades.values(), reverse=True)[:cutoff])
    actual = dcg([grades.get(name, 0) for name in ranking[:cutoff]])
    return actual / ideal


def reciprocal_rank(ranking: Sequence[str], grades: Mapping[str, int]) -> float:
    """Return the inverse position of the first name with the highest judged grade."""
    best = max(grades.values())
    for position, name in enumerate(ranking, start=1):
        if grades.get(name) == best:
            return 1.0 / position
    return 0.0


def _score_query(
    judged: JudgedQuery, outcome: SearchOutcome, thresholds: ThresholdsDocument
) -> list[KindScore]:
    rr_needs = thresholds.metrics.reciprocal_rank.applies_to_needs
    rr_applies = rr_needs is None or judged.need in rr_needs
    scores: list[KindScore] = []
    for kind, grades in judged.judgments.items():
        ranking = [result.ref.name for result in outcome.of_kind(kind)]
        scores.append(
            KindScore(
                query_id=judged.id,
                query=judged.query,
                need=judged.need,
                kind=kind,
                ndcg=ndcg(ranking, grades, thresholds.cutoff),
                reciprocal_rank=reciprocal_rank(ranking, grades) if rr_applies else None,
                ranking=ranking[: thresholds.cutoff],
            )
        )
    return scores


def score_outcomes(
    judgments: JudgmentsDocument,
    thresholds: ThresholdsDocument,
    outcomes: Mapping[str, SearchOutcome],
) -> RelevanceReport:
    """Score search outcomes, keyed by judged query id, against the thresholds.

    Args:
        judgments: Graded judgments.
        thresholds: Minimum metric values.
        outcomes: Search outcome for every judged query id.

    Returns:
        The scores and the thresholds they break.
    """
    scores = [
        score
        for judged in judgments.queries
        for score in _score_query(judged, outcomes[judged.id], thresholds)
    ]
    ndcg_threshold = thresholds.metrics.ndcg
    rr_threshold = thresholds.metrics.reciprocal_rank
    failures: list[ThresholdFailure] = []
    for score in scores:
        scope = f"{score.query_id} {score.kind} ({score.query})"
        if score.ndcg < ndcg_threshold.per_query_minimum:
            failures.append(
                ThresholdFailure(
                    scope=scope,
                    metric="ndcg",
                    value=score.ndcg,
                    minimum=ndcg_threshold.per_query_minimum,
                )
            )
        if (
            score.reciprocal_rank is not None
            and score.reciprocal_rank < rr_threshold.per_query_minimum
        ):
            failures.append(
                ThresholdFailure(
                    scope=scope,
                    metric="reciprocal_rank",
                    value=score.reciprocal_rank,
                    minimum=rr_threshold.per_query_minimum,
                )
            )
    mean_ndcg = fmean(score.ndcg for score in scores)
    if ndcg_threshold.mean_minimum is not None and mean_ndcg < ndcg_threshold.mean_minimum:
        failures.append(
            ThresholdFailure(
                scope="all judged queries",
                metric="mean ndcg",
                value=mean_ndcg,
                minimum=ndcg_threshold.mean_minimum,
            )
        )
    return RelevanceReport(scores=scores, mean_ndcg=mean_ndcg, failures=failures)


def evaluate(
    client: SearchClient, judgments: JudgmentsDocument, thresholds: ThresholdsDocument
) -> RelevanceReport:
    """Run every judged query against the API and score the rankings."""
    outcomes = {judged.id: client.search(judged.query) for judged in judgments.queries}
    return score_outcomes(judgments, thresholds, outcomes)


class GradePair(BaseModel):
    """The rule grade and the assessor grade of one candidate."""

    rule: int
    assessor: int


class AssessorScore(BaseModel):
    """nDCG against assessor grades for the results of one kind, for one query."""

    query_id: str
    query: str
    kind: EntityKind
    ndcg: float


class Disagreement(BaseModel):
    """A candidate whose assessor and rule grades differ widely."""

    query_id: str
    ref: str
    rule: int
    assessor: int


class AssessorReport(BaseModel):
    """Scores against assessor grades, and agreement with the rule grades."""

    status: Literal["not-assessed", "partial", "complete"]
    pending_queries: list[str]
    scores: list[AssessorScore]
    mean_ndcg: float | None
    kappa: float | None
    disagreements: list[Disagreement]
    minimum: float

    @property
    def passed(self) -> bool:
        """Tell whether the pre-registered threshold holds on the graded queries."""
        return self.mean_ndcg is not None and self.mean_ndcg >= self.minimum


def quadratic_weighted_kappa(pairs: Sequence[GradePair], categories: int = 4) -> float | None:
    """Return Cohen's kappa with quadratic weights for grades 0 to categories - 1.

    Args:
        pairs: Rule and assessor grades of the same candidates.
        categories: Number of grade levels.

    Returns:
        The agreement, from -1 to 1, or None when it is undefined.
    """
    if not pairs:
        return None
    total = len(pairs)
    observed = [[0.0] * categories for _ in range(categories)]
    for pair in pairs:
        observed[pair.rule][pair.assessor] += 1 / total
    rule_marginal = [sum(row) for row in observed]
    assessor_marginal = [sum(observed[i][j] for i in range(categories)) for j in range(categories)]
    weight_scale = (categories - 1) ** 2
    disagreement = 0.0
    expected = 0.0
    for i in range(categories):
        for j in range(categories):
            weight = (i - j) ** 2 / weight_scale
            disagreement += weight * observed[i][j]
            expected += weight * rule_marginal[i] * assessor_marginal[j]
    if expected == 0:
        return None
    return 1 - disagreement / expected


def _rule_grade(judgments: Mapping[str, JudgedQuery], query_id: str, ref: EntityRef) -> int | None:
    judged = judgments.get(query_id)
    if judged is None or ref.kind not in judged.judgments:
        return None
    return judged.judgments[ref.kind].get(ref.name, 0)


def score_against_assessments(
    assessments: AssessmentsDocument,
    judgments: JudgmentsDocument,
    thresholds: ThresholdsDocument,
    outcomes: Mapping[str, SearchOutcome],
) -> AssessorReport:
    """Score outcomes of fully graded queries against the assessor grades.

    Args:
        assessments: The assessment sheet.
        judgments: Rule judgments, compared with the assessor grades.
        thresholds: Source of the cutoff and the pre-registered minimum.
        outcomes: Search outcome by query id, for the fully graded queries.

    Returns:
        The report; its status is not-assessed while no query is fully graded.
    """
    by_id = {judged.id: judged for judged in judgments.queries}
    complete = [query for query in assessments.queries if query.complete and query.candidates]
    pending = [query.id for query in assessments.queries if query not in complete]
    scores: list[AssessorScore] = []
    pairs: list[GradePair] = []
    disagreements: list[Disagreement] = []
    for query in complete:
        graded: dict[EntityKind, dict[str, int]] = {}
        for candidate in query.candidates:
            ref = EntityRef.parse(candidate.ref)
            grade = candidate.grade if candidate.grade is not None else 0
            if grade > 0:
                graded.setdefault(ref.kind, {})[ref.name] = grade
            rule = _rule_grade(by_id, query.id, ref)
            if rule is None:
                continue
            pairs.append(GradePair(rule=rule, assessor=grade))
            if abs(rule - grade) >= DISAGREEMENT_GAP:
                disagreements.append(
                    Disagreement(query_id=query.id, ref=candidate.ref, rule=rule, assessor=grade)
                )
        outcome = outcomes[query.id]
        scores.extend(
            AssessorScore(
                query_id=query.id,
                query=query.query,
                kind=kind,
                ndcg=ndcg(
                    [result.ref.name for result in outcome.of_kind(kind)],
                    grades,
                    thresholds.cutoff,
                ),
            )
            for kind, grades in graded.items()
        )
    status: Literal["not-assessed", "partial", "complete"] = (
        "not-assessed" if not complete else "partial" if pending else "complete"
    )
    return AssessorReport(
        status=status,
        pending_queries=pending,
        scores=scores,
        mean_ndcg=fmean(score.ndcg for score in scores) if scores else None,
        kappa=quadratic_weighted_kappa(pairs),
        disagreements=disagreements,
        minimum=thresholds.assessor.ndcg_mean_minimum,
    )


def evaluate_assessments(
    client: SearchClient,
    assessments: AssessmentsDocument,
    judgments: JudgmentsDocument,
    thresholds: ThresholdsDocument,
) -> AssessorReport:
    """Run every fully graded query against the API and score it against the assessor."""
    outcomes = {
        query.id: client.search(query.query)
        for query in assessments.queries
        if query.complete and query.candidates
    }
    return score_against_assessments(assessments, judgments, thresholds, outcomes)


def format_assessor_report(report: AssessorReport) -> str:
    """Render an assessor report as plain text."""
    if report.status == "not-assessed":
        return (
            "Assessor evaluation has not run: no query is fully graded in "
            "specs/relevance/assessments.yaml."
        )
    lines = [f"{'query':<12} {'kind':<8} {'nDCG':>6}  query text"]
    lines.extend(
        f"{score.query_id:<12} {score.kind:<8} {score.ndcg:>6.3f}  {score.query}"
        for score in report.scores
    )
    kappa = "undefined" if report.kappa is None else f"{report.kappa:.3f}"
    mean = "undefined" if report.mean_ndcg is None else f"{report.mean_ndcg:.3f}"
    lines.append(
        f"mean nDCG against assessor: {mean} (pre-registered minimum {report.minimum:.2f})"
    )
    lines.append(f"agreement with rule grades, quadratic-weighted kappa: {kappa}")
    if report.disagreements:
        lines.append(f"to adjudicate, grades {DISAGREEMENT_GAP} or more apart (rule -> assessor):")
        lines.extend(
            f"  {item.query_id:<12} {item.ref:<24} {item.rule} -> {item.assessor}"
            for item in report.disagreements
        )
    if report.pending_queries:
        lines.append(f"not yet fully graded: {', '.join(report.pending_queries)}")
    return "\n".join(lines)


def format_report(report: RelevanceReport) -> str:
    """Render a report as a plain-text table followed by the failures."""
    lines = [f"{'query':<12} {'kind':<8} {'nDCG':>6} {'RR':>6}  query text"]
    for score in report.scores:
        rr = "-" if score.reciprocal_rank is None else f"{score.reciprocal_rank:.2f}"
        lines.append(
            f"{score.query_id:<12} {score.kind:<8} {score.ndcg:>6.3f} {rr:>6}  {score.query}"
        )
    lines.append(f"mean nDCG: {report.mean_ndcg:.3f}")
    if report.failures:
        lines.append("Thresholds not met:")
        lines.extend(
            f"  {failure.scope}: {failure.metric} {failure.value:.3f} < {failure.minimum:.2f}"
            for failure in report.failures
        )
    else:
        lines.append("All relevance thresholds are met.")
    return "\n".join(lines)


def main() -> None:
    """Evaluate a running search API from the command line."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--base-url",
        default=os.environ.get(API_URL_VARIABLE, DEFAULT_API_URL),
        help=f"Root URL of the search API (default: ${API_URL_VARIABLE} or {DEFAULT_API_URL}).",
    )
    arguments = parser.parse_args()
    client = SearchClient(base_url=arguments.base_url, contract=ContractValidator())
    judgments = load_judgments()
    thresholds = load_thresholds()
    try:
        client.ensure_available()
        report = evaluate(client, judgments, thresholds)
        assessor = evaluate_assessments(client, load_assessments(), judgments, thresholds)
    except (SearchApiUnavailableError, ContractViolationError) as error:
        print(error, file=sys.stderr)
        sys.exit(1)
    finally:
        client.close()
    print(format_report(report))
    print()
    print(format_assessor_report(assessor))
    if not report.passed or (assessor.status != "not-assessed" and not assessor.passed):
        sys.exit(1)
