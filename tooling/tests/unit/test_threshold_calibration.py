"""Lock in what the relevance thresholds accept and reject.

The thresholds must accept an ideal ranking and small ordering slips, and
reject an irrelevant first result and a naive full-text search.
"""

from collections.abc import Callable, Mapping

import pytest

from pokedex_tooling import baselines
from pokedex_tooling.client import Outcome, RankedResult, SearchOutcome
from pokedex_tooling.entities import EntityKind, EntityRef
from pokedex_tooling.relevance import RelevanceReport, score_outcomes
from pokedex_tooling.snapshot import load_snapshot
from pokedex_tooling.specs import JudgedQuery, load_judgments, load_thresholds

Ranker = Callable[[JudgedQuery, EntityKind, Mapping[str, int]], list[str]]
SNAPSHOT = load_snapshot()


def by_grade(grades: Mapping[str, int]) -> list[str]:
    return sorted(grades, key=lambda name: -grades[name])


def ideal(judged: JudgedQuery, kind: EntityKind, grades: Mapping[str, int]) -> list[str]:
    return by_grade(grades)


def top_two_swapped(judged: JudgedQuery, kind: EntityKind, grades: Mapping[str, int]) -> list[str]:
    ranking = by_grade(grades)
    if len(ranking) > 1:
        ranking[0], ranking[1] = ranking[1], ranking[0]
    return ranking


def irrelevant_first(judged: JudgedQuery, kind: EntityKind, grades: Mapping[str, int]) -> list[str]:
    return ["unjudged-entity", *by_grade(grades)]


def naive_full_text(judged: JudgedQuery, kind: EntityKind, grades: Mapping[str, int]) -> list[str]:
    return baselines.naive_full_text(SNAPSHOT, judged.query, kind)


def report_for(ranker: Ranker) -> RelevanceReport:
    judgments = load_judgments()
    outcomes: dict[str, SearchOutcome] = {}
    for judged in judgments.queries:
        names = [
            EntityRef(kind=kind, name=name)
            for kind, grades in judged.judgments.items()
            for name in ranker(judged, kind, grades)
        ]
        outcomes[judged.id] = SearchOutcome(
            query=judged.query,
            outcome=Outcome.RESULTS,
            explanation=None,
            results=[
                RankedResult(ref=ref, rank=rank, types=[])
                for rank, ref in enumerate(names, start=1)
            ],
        )
    return score_outcomes(judgments, load_thresholds(), outcomes)


def test_ideal_rankings_meet_every_threshold() -> None:
    report = report_for(ideal)
    assert report.passed, report.failures


def test_swapping_the_top_two_keeps_the_mean_above_its_minimum() -> None:
    minimum = load_thresholds().metrics.ndcg.mean_minimum
    assert minimum is not None
    assert report_for(top_two_swapped).mean_ndcg >= minimum


def test_an_irrelevant_first_result_fails_every_judged_query() -> None:
    report = report_for(irrelevant_first)
    failed = {failure.scope for failure in report.failures if failure.metric == "ndcg"}
    assert len(failed) == len(report.scores)


@pytest.mark.parametrize(
    "need", ["criteria-comparison", "intent-discovery", "strategy-exploration"]
)
def test_naive_full_text_search_fails_every_advanced_need(need: str) -> None:
    report = report_for(naive_full_text)
    failed_needs = {
        score.need
        for score in report.scores
        if any(failure.scope.startswith(score.query_id) for failure in report.failures)
    }
    assert need in failed_needs
    minimum = load_thresholds().metrics.ndcg.mean_minimum
    assert minimum is not None
    assert report.mean_ndcg < minimum
