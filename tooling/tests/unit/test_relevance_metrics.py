import math

import pytest

from pokedex_tooling.client import Outcome, RankedResult, SearchOutcome
from pokedex_tooling.entities import EntityKind, EntityRef
from pokedex_tooling.relevance import condensed_ndcg, ndcg, reciprocal_rank, score_outcomes
from pokedex_tooling.specs import (
    AssessorThreshold,
    JudgedQuery,
    JudgmentsDocument,
    MetricThreshold,
    ThresholdMetrics,
    ThresholdsDocument,
)


def thresholds(per_query: float = 0.8, mean: float = 0.9) -> ThresholdsDocument:
    return ThresholdsDocument(
        schema_version=1,
        cutoff=10,
        metrics=ThresholdMetrics(
            ndcg=MetricThreshold(description="", per_query_minimum=per_query, mean_minimum=mean),
            reciprocal_rank=MetricThreshold(
                description="", per_query_minimum=1.0, applies_to_needs=["name-recovery"]
            ),
        ),
        assessor=AssessorThreshold(ndcg_mean_minimum=0.8),
    )


def judgments(*queries: JudgedQuery) -> JudgmentsDocument:
    return JudgmentsDocument(schema_version=1, grades={}, queries=list(queries))


def pokemon_outcome(*names: str) -> SearchOutcome:
    return SearchOutcome(
        query="test",
        outcome=Outcome.RESULTS,
        explanation=None,
        results=[
            RankedResult(ref=EntityRef(kind=EntityKind.POKEMON, name=name), rank=rank, types=[])
            for rank, name in enumerate(names, start=1)
        ],
    )


def test_ideal_ranking_scores_one() -> None:
    assert ndcg(["a", "b", "c"], {"a": 3, "b": 2, "c": 1}, cutoff=10) == pytest.approx(1.0)


def test_swapped_ranking_matches_the_formula() -> None:
    expected = (1 + 7 / math.log2(3)) / (7 + 1 / math.log2(3))
    assert ndcg(["b", "a"], {"a": 3, "b": 1}, cutoff=10) == pytest.approx(expected)


def test_unjudged_names_score_zero_and_the_cutoff_truncates() -> None:
    assert ndcg(["x", "y"], {"a": 3}, cutoff=10) == 0.0
    assert ndcg(["x", "a"], {"a": 3}, cutoff=1) == 0.0


def test_condensed_ndcg_skips_unjudged_names_but_not_judged_zeros() -> None:
    assert condensed_ndcg(["x", "a"], {"a": 3}, cutoff=1) == pytest.approx(1.0)
    assert condensed_ndcg(["z", "a"], {"a": 3, "z": 0}, cutoff=1) == 0.0


def test_reciprocal_rank_targets_the_highest_grade() -> None:
    assert reciprocal_rank(["b", "c", "a"], {"a": 3, "b": 2}) == pytest.approx(1 / 3)
    assert reciprocal_rank(["b"], {"a": 3, "b": 2}) == 0.0


def test_kinds_without_judgments_are_not_scored() -> None:
    judged = JudgedQuery(
        id="Q-NAME-01",
        need="name-recovery",
        query="mew",
        grading_rule="",
        judgments={EntityKind.POKEMON: {"mew": 3, "mewtwo": 2}},
    )
    report = score_outcomes(
        judgments(judged), thresholds(), {"Q-NAME-01": pokemon_outcome("mew", "mewtwo")}
    )
    assert [score.kind for score in report.scores] == [EntityKind.POKEMON]
    assert report.passed


def test_reciprocal_rank_only_applies_to_listed_needs() -> None:
    name_query = JudgedQuery(
        id="Q-NAME-01",
        need="name-recovery",
        query="mew",
        grading_rule="",
        judgments={EntityKind.POKEMON: {"mew": 3, "mewtwo": 2}},
    )
    criteria_query = name_query.model_copy(
        update={"id": "Q-CRIT-01", "need": "criteria-comparison"}
    )
    outcome = pokemon_outcome("mewtwo", "mew")
    report = score_outcomes(
        judgments(name_query, criteria_query),
        thresholds(per_query=0.0, mean=0.0),
        {"Q-NAME-01": outcome, "Q-CRIT-01": outcome},
    )
    assert [failure.metric for failure in report.failures] == ["reciprocal_rank"]
    assert report.failures[0].scope.startswith("Q-NAME-01")


def test_per_query_and_mean_thresholds_are_reported() -> None:
    judged = JudgedQuery(
        id="Q-CRIT-01",
        need="criteria-comparison",
        query="fast electric pokemon",
        grading_rule="",
        judgments={EntityKind.POKEMON: {"electrode": 3, "jolteon": 3}},
    )
    report = score_outcomes(
        judgments(judged), thresholds(), {"Q-CRIT-01": pokemon_outcome("pikachu", "electrode")}
    )
    assert {failure.metric for failure in report.failures} == {"ndcg", "mean ndcg"}
    assert not report.passed
