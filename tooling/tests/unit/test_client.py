from collections.abc import Callable

import httpx
import pytest

from pokedex_tooling.client import (
    Outcome,
    SearchApiUnavailableError,
    SearchClient,
    SearchOutcome,
)
from pokedex_tooling.contract import ContractValidator, ContractViolationError
from pokedex_tooling.entities import EntityRef

BASE_URL = "http://search.test"
Handler = Callable[[httpx.Request], httpx.Response]


def pokemon_result(name: str, rank: int, types: list[str]) -> dict[str, object]:
    return {
        "kind": "pokemon",
        "name": name,
        "rank": rank,
        "role": None,
        "reasons": [{"type": "type-filter", "detail": "Electric type", "related": None}],
        "id": rank,
        "types": types,
        "stats": {
            "hp": 60,
            "attack": 50,
            "defense": 70,
            "special-attack": 80,
            "special-defense": 80,
            "speed": 150,
        },
        "abilities": ["static"],
        "genus": "Ball Pokémon",
        "description": None,
        "sprite_url": None,
    }


def move_result(name: str, rank: int) -> dict[str, object]:
    return {
        "kind": "move",
        "name": name,
        "rank": rank,
        "role": None,
        "reasons": [{"type": "name-exact", "detail": "Exact name", "related": None}],
        "id": 87,
        "type": "electric",
        "damage_class": "special",
        "power": 110,
        "accuracy": 70,
        "pp": 10,
        "priority": 0,
        "effect_chance": 30,
        "short_effect": "Has a chance to paralyze the target.",
    }


def response_body(results: list[dict[str, object]]) -> dict[str, object]:
    return {
        "query": "electric",
        "outcome": "results",
        "interpretation": {"readings": ["name", "criteria"], "summary": "Electric"},
        "explanation": None,
        "notices": [],
        "results": results,
    }


def make_client(contract: ContractValidator, handler: Handler) -> SearchClient:
    return SearchClient(
        base_url=BASE_URL, contract=contract, transport=httpx.MockTransport(handler)
    )


def search_with(contract: ContractValidator, handler: Handler) -> SearchOutcome:
    client = make_client(contract, handler)
    try:
        return client.search("electric")
    finally:
        client.close()


def test_valid_response_is_reduced_to_ranked_results(contract: ContractValidator) -> None:
    body = response_body([move_result("thunder", 2), pokemon_result("electrode", 1, ["electric"])])
    outcome = search_with(contract, lambda request: httpx.Response(200, json=body))
    assert outcome.outcome == Outcome.RESULTS
    assert [str(result.ref) for result in outcome.results] == ["pokemon:electrode", "move:thunder"]
    assert outcome.results[0].types == ["electric"]


def test_query_is_sent_unchanged(contract: ContractValidator) -> None:
    seen: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(request.url.params["q"])
        return httpx.Response(200, json=response_body([]))

    client = make_client(contract, handler)
    client.search("  BULBA ")
    client.close()
    assert seen == ["  BULBA "]


def test_validation_error_maps_to_invalid_outcome(contract: ContractValidator) -> None:
    body = {"error": {"code": "invalid_query", "message": "Too short."}}
    outcome = search_with(contract, lambda request: httpx.Response(400, json=body))
    assert outcome.outcome == Outcome.INVALID
    assert outcome.results == []


def test_result_without_reasons_breaks_the_contract(contract: ContractValidator) -> None:
    result = pokemon_result("electrode", 1, ["electric"])
    result["reasons"] = []
    body = response_body([result])
    with pytest.raises(ContractViolationError, match="SearchResponse"):
        search_with(contract, lambda request: httpx.Response(200, json=body))


def test_empty_outcome_requires_an_explanation(contract: ContractValidator) -> None:
    body = response_body([])
    body["outcome"] = "empty"
    with pytest.raises(ContractViolationError):
        search_with(contract, lambda request: httpx.Response(200, json=body))


def test_rank_gaps_break_the_contract(contract: ContractValidator) -> None:
    body = response_body([pokemon_result("electrode", 1, ["electric"]), move_result("thunder", 3)])
    with pytest.raises(ContractViolationError, match="Ranks"):
        search_with(contract, lambda request: httpx.Response(200, json=body))


def test_server_error_is_reported(contract: ContractValidator) -> None:
    body = {"error": {"code": "internal_error", "message": "The search failed unexpectedly."}}
    with pytest.raises(ContractViolationError, match="HTTP 500"):
        search_with(contract, lambda request: httpx.Response(500, json=body))


def test_non_json_response_is_reported(contract: ContractValidator) -> None:
    with pytest.raises(ContractViolationError, match="not JSON"):
        search_with(contract, lambda request: httpx.Response(200, text="<html>"))


def test_unreachable_api_is_reported(contract: ContractValidator) -> None:
    def refuse(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("Connection refused", request=request)

    client = make_client(contract, refuse)
    with pytest.raises(SearchApiUnavailableError, match="POKEDEX_API_URL"):
        client.ensure_available()
    client.close()


def test_entity_references_round_trip() -> None:
    assert str(EntityRef.parse("move:thunder-wave")) == "move:thunder-wave"
    with pytest.raises(ValueError, match="kind:name"):
        EntityRef.parse("thunder-wave")
