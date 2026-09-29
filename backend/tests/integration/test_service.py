import time

import pytest
from fastapi.testclient import TestClient
from hypothesis import given, settings
from hypothesis import strategies as st

from pokedex_search.api.app import create_app
from pokedex_search.api.dependencies import UseCases
from pokedex_search.bootstrap import build_use_cases
from pokedex_search.infrastructure.settings import Settings
from tests.contracts.openapi import OpenApiContract

QUERIES = [
    "bulba",
    "fast electric pokemon",
    "put the opponent to sleep",
    "rain team",
    "water pokemon that can put the opponent to sleep",
    "moves learned by pikachu",
    "psychic",
    "xyzzy",
    "fast dark pokemon",
]
BUILD_BUDGET_SECONDS = 0.5
QUERY_BUDGET_SECONDS = 0.02
PERCENTILE_95 = 0.95
CONTRACT = OpenApiContract()


@pytest.fixture(scope="module")
def use_cases() -> UseCases:
    return build_use_cases(Settings())


@pytest.fixture(scope="module")
def client(use_cases: UseCases) -> TestClient:
    return TestClient(create_app(use_cases, []))


@pytest.mark.performance
def test_the_index_builds_within_budget() -> None:
    started = time.perf_counter()
    build_use_cases(Settings())
    assert time.perf_counter() - started < BUILD_BUDGET_SECONDS


@pytest.mark.performance
def test_searches_stay_within_the_latency_budget(client: TestClient) -> None:
    durations: list[float] = []
    for query in QUERIES * 5:
        started = time.perf_counter()
        client.get("/api/search", params={"q": query})
        durations.append(time.perf_counter() - started)
    durations.sort()
    assert durations[int(len(durations) * PERCENTILE_95) - 1] < QUERY_BUDGET_SECONDS


@pytest.mark.parametrize("query", QUERIES)
def test_real_responses_follow_the_contract(client: TestClient, query: str) -> None:
    body = client.get("/api/search", params={"q": query}).json()
    assert CONTRACT.errors(body, "SearchResponse") == []


@settings(max_examples=25, deadline=None)
@given(limit=st.integers(min_value=1, max_value=30))
def test_pages_concatenate_to_the_full_ranking(client: TestClient, limit: int) -> None:
    query = "rain team"
    full = client.get("/api/search", params={"q": query, "limit": 100}).json()
    pokemon = next(section for section in full["sections"] if section["kind"] == "pokemon")
    names: list[str] = []
    params: dict[str, str | int] = {"q": query, "kind": "pokemon", "limit": limit}
    while True:
        page = client.get("/api/search", params=params).json()["sections"][0]
        names += [result["name"] for result in page["results"]]
        if page["next_cursor"] is None:
            break
        params = {"q": query, "kind": "pokemon", "limit": limit, "cursor": page["next_cursor"]}
    assert names == [result["name"] for result in pokemon["results"]]
    assert len(names) == pokemon["total"]
