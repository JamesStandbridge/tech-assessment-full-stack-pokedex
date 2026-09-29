import pytest
from fastapi.testclient import TestClient

from pokedex_search.api.app import create_app
from pokedex_search.api.dependencies import UseCases
from pokedex_search.domain.details import EntityDetail
from pokedex_search.domain.entities import EntityKind
from pokedex_search.domain.errors import InvalidParameterError, InvalidQueryError
from pokedex_search.domain.results import (
    Interpretation,
    Reason,
    ReasonType,
    SearchOutcome,
    SearchResult,
    Section,
    SectionItem,
)
from tests.contracts.openapi import OpenApiContract
from tests.fakes.entities import move, pokemon
from tests.fakes.services import FakeEntities, FakeHealth, FakeSearch, FakeSuggest

CONTRACT = OpenApiContract()
PIKACHU = pokemon("pikachu", 25, ("electric",))
RESULT = SearchResult(
    query="pikachu",
    canonical_query="pikachu",
    outcome=SearchOutcome.RESULTS,
    interpretation=Interpretation(terms=(), alternatives=(), summary="names matching 'pikachu'"),
    notices=(),
    explanation=None,
    suggestions=(),
    best_match=PIKACHU.ref,
    refinements=(),
    sections=(
        Section(
            kind=EntityKind.POKEMON,
            total=1,
            items=(
                SectionItem(
                    rank=1,
                    entity=PIKACHU,
                    reasons=(Reason(type=ReasonType.NAME_EXACT, detail="Exact name"),),
                ),
            ),
            next_cursor=None,
        ),
    ),
)


def _client(search: FakeSearch) -> TestClient:
    details = {
        PIKACHU.ref: EntityDetail(entity=PIKACHU, evolution_family=("pikachu",)),
        move("thunder", 87).ref: EntityDetail(entity=move("thunder", 87), evolution_family=()),
    }
    use_cases = UseCases(
        search=search, entities=FakeEntities(details), suggest=FakeSuggest(), health=FakeHealth()
    )
    return TestClient(
        create_app(use_cases, ["http://localhost:5173"]), raise_server_exceptions=False
    )


def test_a_search_response_follows_the_contract() -> None:
    search = FakeSearch(RESULT)
    response = _client(search).get("/api/search", params={"q": "pikachu", "limit": 5})
    assert response.status_code == 200
    assert CONTRACT.errors(response.json(), "SearchResponse") == []
    assert search.requests[0].page.limit == 5


@pytest.mark.parametrize(
    ("params", "error", "code"),
    [
        ({"q": "a"}, InvalidQueryError("too short"), "invalid_query"),
        ({"q": "pikachu", "cursor": "x"}, InvalidParameterError("bad cursor"), "invalid_parameter"),
        ({}, None, "invalid_query"),
        ({"q": "pikachu", "limit": "many"}, None, "invalid_parameter"),
        ({"q": "pikachu", "kind": "item"}, None, "invalid_parameter"),
    ],
)
def test_invalid_requests_get_a_400_in_the_contract_shape(
    params: dict[str, str], error: Exception | None, code: str
) -> None:
    response = _client(FakeSearch(error or RESULT)).get("/api/search", params=params)
    assert response.status_code == 400
    assert response.json()["error"]["code"] == code
    assert CONTRACT.errors(response.json(), "ErrorResponse") == []


def test_an_unexpected_failure_leaks_no_internal_detail() -> None:
    failure = RuntimeError("secret at /Users/somebody/.env line 3")
    response = _client(FakeSearch(failure)).get("/api/search", params={"q": "pikachu"})
    assert response.status_code == 500
    assert CONTRACT.errors(response.json(), "ErrorResponse") == []
    assert "secret" not in response.text
    assert "Traceback" not in response.text


def test_entity_details_and_missing_entities_follow_the_contract() -> None:
    client = _client(FakeSearch(RESULT))
    found = client.get("/api/entities/pokemon/pikachu")
    missing = client.get("/api/entities/move/rain-dance")
    assert CONTRACT.errors(found.json(), "EntityDetail") == []
    assert (missing.status_code, missing.json()["error"]["code"]) == (404, "not_found")


def test_health_and_suggestions_follow_the_contract() -> None:
    client = _client(FakeSearch(RESULT))
    health = client.get("/api/health").json()
    assert health == {"status": "ok", "dataset_sha256": "fake-version"}
    assert (
        CONTRACT.errors(client.get("/api/suggest", params={"q": "pi"}).json(), "SuggestResponse")
        == []
    )
