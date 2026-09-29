from datetime import date

import pytest

from pokedex_tooling.client import Outcome, RankedResult, SearchOutcome
from pokedex_tooling.entities import EntityKind, EntityRef
from pokedex_tooling.pooling import FrozenAssessmentsError, build_assessments, shuffle_key
from pokedex_tooling.relevance import GradePair, quadratic_weighted_kappa, score_against_assessments
from pokedex_tooling.snapshot import load_snapshot
from pokedex_tooling.specs import (
    AssessedQuery,
    AssessmentsDocument,
    Candidate,
    JudgedQuery,
    JudgmentsDocument,
    load_thresholds,
)
from pokedex_tooling.validate_specs import check_assessments, load_dataset_index

SNAPSHOT = load_snapshot()
JUDGMENTS = JudgmentsDocument(
    schema_version=1,
    grades={},
    queries=[
        JudgedQuery(
            id="Q-NAME-02",
            need="name-recovery",
            query="mew",
            grading_rule="",
            judgments={EntityKind.POKEMON: {"mew": 3, "mewtwo": 2}},
        )
    ],
)


def sheet(
    grades: dict[str, int | None], extra: list[AssessedQuery] | None = None
) -> AssessmentsDocument:
    return AssessmentsDocument(
        schema_version=1,
        instructions="",
        grades={},
        queries=[
            AssessedQuery(
                id="Q-NAME-02",
                query="mew",
                candidates=[
                    Candidate(ref=ref, summary="", grade=grade) for ref, grade in grades.items()
                ],
            ),
            *(extra or []),
        ],
    )


def pokemon_outcome(*names: str) -> SearchOutcome:
    return SearchOutcome(
        query="mew",
        outcome=Outcome.RESULTS,
        explanation=None,
        results=[
            RankedResult(ref=EntityRef(kind=EntityKind.POKEMON, name=name), rank=rank, types=[])
            for rank, name in enumerate(names, start=1)
        ],
    )


def test_perfect_agreement_gives_a_kappa_of_one() -> None:
    pairs = [GradePair(rule=grade, assessor=grade) for grade in (0, 1, 2, 3, 3)]
    assert quadratic_weighted_kappa(pairs) == pytest.approx(1.0)


def test_kappa_matches_a_hand_computed_value() -> None:
    pairs = [GradePair(rule=0, assessor=0), GradePair(rule=3, assessor=2)]
    assert quadratic_weighted_kappa(pairs) == pytest.approx(1 - (1 / 18) / (7 / 18))


def test_kappa_is_undefined_without_pairs_or_variation() -> None:
    assert quadratic_weighted_kappa([]) is None
    assert quadratic_weighted_kappa([GradePair(rule=2, assessor=2)]) is None


def test_pool_is_deterministic_and_hides_the_source_order() -> None:
    first = build_assessments(SNAPSHOT, JUDGMENTS, None, {})
    second = build_assessments(SNAPSHOT, JUDGMENTS, None, {})
    assert first == second
    refs = [candidate.ref for candidate in first.queries[0].candidates]
    assert {"pokemon:mew", "pokemon:mewtwo"} <= set(refs)
    assert refs == sorted(refs, key=lambda ref: shuffle_key("Q-NAME-02", EntityRef.parse(ref)))


def test_pooling_again_keeps_existing_grades() -> None:
    first = build_assessments(SNAPSHOT, JUDGMENTS, None, {})
    graded = first.model_copy(deep=True)
    for candidate in graded.queries[0].candidates:
        candidate.grade = 3 if candidate.ref == "pokemon:mew" else 0
    again = build_assessments(SNAPSHOT, JUDGMENTS, graded, {})
    assert again == graded


def test_pooling_again_keeps_candidates_no_ranker_proposes_anymore() -> None:
    graded = sheet({"pokemon:mew": 3, "pokemon:ditto": 1})
    again = build_assessments(SNAPSHOT, JUDGMENTS, graded, {})
    kept = {candidate.ref: candidate.grade for candidate in again.queries[0].candidates}
    assert kept["pokemon:ditto"] == 1


def test_live_results_join_the_pool() -> None:
    live = {"Q-NAME-02": pokemon_outcome("mew", "abra")}
    refs = {
        candidate.ref
        for candidate in build_assessments(SNAPSHOT, JUDGMENTS, None, live).queries[0].candidates
    }
    assert "pokemon:abra" in refs


def test_user_queries_are_pooled_across_every_kind() -> None:
    user = AssessedQuery(id="Q-USER-01", query="thunder", candidates=[])
    document = build_assessments(SNAPSHOT, JUDGMENTS, sheet({}, [user]), {})
    pooled = next(query for query in document.queries if query.id == "Q-USER-01")
    assert "move:thunder" in {candidate.ref for candidate in pooled.candidates}


def test_report_has_not_run_until_a_candidate_is_graded() -> None:
    report = score_against_assessments(
        sheet({"pokemon:mew": None, "pokemon:mewtwo": None}), JUDGMENTS, load_thresholds(), {}
    )
    assert report.status == "not-assessed"
    assert not report.passed


def test_unjudged_results_are_left_out_of_the_ranking() -> None:
    report = score_against_assessments(
        sheet({"pokemon:mew": 3, "pokemon:mewtwo": None}),
        JUDGMENTS,
        load_thresholds(),
        {"Q-NAME-02": pokemon_outcome("mewtwo", "abra", "mew", "ditto")},
    )
    assert report.status == "partial"
    assert report.pending_queries == ["Q-NAME-02"]
    assert report.mean_ndcg == pytest.approx(1.0)
    assert report.judged_share == pytest.approx(0.25)


def test_a_frozen_sheet_takes_no_more_candidates() -> None:
    frozen = sheet({"pokemon:mew": 3}).model_copy(update={"frozen_on": date(2026, 9, 29)})
    with pytest.raises(FrozenAssessmentsError):
        build_assessments(SNAPSHOT, JUDGMENTS, frozen, {})


def test_report_scores_the_live_ranking_against_the_assessor() -> None:
    assessments = sheet({"pokemon:mew": 3, "pokemon:mewtwo": 2, "pokemon:abra": 0})
    good = score_against_assessments(
        assessments, JUDGMENTS, load_thresholds(), {"Q-NAME-02": pokemon_outcome("mew", "mewtwo")}
    )
    assert good.status == "complete"
    assert good.mean_ndcg == pytest.approx(1.0)
    assert good.kappa == pytest.approx(1.0)
    assert good.passed
    bad = score_against_assessments(
        assessments, JUDGMENTS, load_thresholds(), {"Q-NAME-02": pokemon_outcome("abra", "mewtwo")}
    )
    assert not bad.passed
    assert good.disagreements == []


def test_wide_disagreements_are_listed_for_adjudication() -> None:
    assessments = sheet({"pokemon:mew": 1, "pokemon:mewtwo": 2, "pokemon:abra": 3})
    report = score_against_assessments(
        assessments, JUDGMENTS, load_thresholds(), {"Q-NAME-02": pokemon_outcome("mew")}
    )
    assert [(item.ref, item.rule, item.assessor) for item in report.disagreements] == [
        ("pokemon:mew", 3, 1),
        ("pokemon:abra", 0, 3),
    ]


def test_assessment_sheet_problems_are_reported() -> None:
    index = load_dataset_index()
    broken = sheet(
        {"pokemon:mew": None, "pokemon:missingno": None},
        [AssessedQuery(id="Q-EXTRA-01", query="mew", candidates=[])],
    )
    messages = [problem.message for problem in check_assessments(broken, JUDGMENTS, index)]
    assert any("not in the dataset" in message for message in messages)
    assert "Queries added by assessors use Q-USER-nn." in messages


def test_a_judged_query_missing_from_the_sheet_is_reported() -> None:
    empty = AssessmentsDocument(schema_version=1, instructions="", grades={}, queries=[])
    problems = check_assessments(empty, JUDGMENTS, load_dataset_index())
    assert [problem.message for problem in problems] == [
        "Judged query missing; run pool-assessments."
    ]
