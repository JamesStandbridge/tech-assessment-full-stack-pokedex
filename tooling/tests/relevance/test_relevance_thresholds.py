import pytest

from pokedex_tooling.client import SearchClient
from pokedex_tooling.relevance import (
    evaluate,
    evaluate_assessments,
    format_assessor_report,
    format_report,
)
from pokedex_tooling.specs import load_assessments, load_judgments, load_thresholds


def test_rankings_meet_relevance_thresholds(search_client: SearchClient) -> None:
    report = evaluate(search_client, load_judgments(), load_thresholds())
    assert report.passed, format_report(report)


def test_rankings_meet_the_pre_registered_assessor_threshold(search_client: SearchClient) -> None:
    report = evaluate_assessments(
        search_client, load_assessments(), load_judgments(), load_thresholds()
    )
    if report.status == "not-assessed":
        pytest.skip(format_assessor_report(report))
    assert report.passed, format_assessor_report(report)
