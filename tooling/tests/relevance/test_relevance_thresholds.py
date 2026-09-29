from pokedex_tooling.client import SearchClient
from pokedex_tooling.relevance import evaluate, format_report
from pokedex_tooling.specs import load_judgments, load_thresholds


def test_rankings_meet_relevance_thresholds(search_client: SearchClient) -> None:
    report = evaluate(search_client, load_judgments(), load_thresholds())
    assert report.passed, format_report(report)
