"""Score search rankings against graded judgments and relevance thresholds."""

import argparse
import math
import os
import sys
from collections.abc import Mapping, Sequence
from statistics import fmean

from pydantic import BaseModel

from pokedex_tooling.client import (
    API_URL_VARIABLE,
    DEFAULT_API_URL,
    SearchApiUnavailableError,
    SearchClient,
    SearchOutcome,
)
from pokedex_tooling.contract import ContractValidator, ContractViolationError
from pokedex_tooling.entities import EntityKind
from pokedex_tooling.specs import (
    JudgedQuery,
    JudgmentsDocument,
    ThresholdsDocument,
    load_judgments,
    load_thresholds,
)


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
    try:
        client.ensure_available()
        report = evaluate(client, load_judgments(), load_thresholds())
    except (SearchApiUnavailableError, ContractViolationError) as error:
        print(error, file=sys.stderr)
        sys.exit(1)
    finally:
        client.close()
    print(format_report(report))
    if not report.passed:
        sys.exit(1)
