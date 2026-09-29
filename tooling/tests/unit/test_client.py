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


def reason(reason_type: str = "type-filter") -> dict[str, object]:
    return {
        "type": reason_type,
        "detail": "Electric type",
        "related": None,
        "probability": None,
        "mode": None,
        "target": None,
        "weather_role": None,
    }


def pokemon_result(name: str, rank: int, types: list[str]) -> dict[str, object]:
    return {
        "kind": "pokemon",
        "name": name,
        "rank": rank,
        "reasons": [reason()],
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
        "artwork_url": None,
    }


def move_result(name: str, rank: int) -> dict[str, object]:
    return {
        "kind": "move",
        "name": name,
        "rank": rank,
        "reasons": [reason("name-exact")],
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


def section(
    kind: str, results: list[dict[str, object]], total: int, next_cursor: str | None = None
) -> dict[str, object]:
    return {"kind": kind, "total": total, "results": results, "next_cursor": next_cursor}


def response_body(sections: list[dict[str, object]]) -> dict[str, object]:
    return {
        "query": "electric",
        "canonical_query": "electric pokemon",
        "outcome": "results" if sections else "empty",
        "interpretation": {
            "readings": [
                {
                    "reading": "criteria",
                    "types": ["electric"],
                    "sort": [{"stat": "speed", "direction": "desc"}],
                    "filters": [{"stat": "speed", "comparator": "gt", "value": 100}],
                }
            ],
            "summary": "Electric Pokémon",
        },
        "terms": [
            {"text": "electric", "role": "type", "value": "electric"},
            {"text": "brock", "role": "ignored", "value": None},
        ],
        "notices": [{"code": "ignored-terms", "message": "Ignored: brock."}],
        "explanation": None if sections else "Nothing matches.",
        "suggestions": [],
        "best_match": None,
        "refinements": [
            {
                "constraint": "type:electric",
                "action": "remove",
                "label": "Any type",
                "query": "pokemon",
            }
        ],
        "sections": sections,
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


def paged(pages: dict[str | None, dict[str, object]]) -> Handler:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=pages[request.url.params.get("cursor")])

    return handler


def test_sections_are_flattened_in_section_order(contract: ContractValidator) -> None:
    body = response_body(
        [
            section("pokemon", [pokemon_result("electrode", 1, ["electric"])], total=1),
            section("move", [move_result("thunder", 1)], total=1),
        ]
    )
    outcome = search_with(contract, lambda request: httpx.Response(200, json=body))
    assert outcome.outcome == Outcome.RESULTS
    assert [str(result.ref) for result in outcome.results] == ["pokemon:electrode", "move:thunder"]
    assert outcome.results[0].types == ["electric"]


def test_interpretation_fields_are_kept(contract: ContractValidator) -> None:
    body = response_body([section("move", [move_result("thunder", 1)], total=1)])
    body["best_match"] = {"kind": "move", "name": "thunder"}
    outcome = search_with(contract, lambda request: httpx.Response(200, json=body))
    assert outcome.canonical_query == "electric pokemon"
    assert [(term.text, term.role) for term in outcome.terms] == [
        ("electric", "type"),
        ("brock", "ignored"),
    ]
    assert [notice.code for notice in outcome.notices] == ["ignored-terms"]
    assert outcome.best_match == EntityRef.parse("move:thunder")


def test_every_page_of_a_section_is_collected(contract: ContractValidator) -> None:
    seen: list[dict[str, str]] = []
    pages = {
        None: response_body(
            [section("pokemon", [pokemon_result("electrode", 1, ["electric"])], 2, "page-2")]
        ),
        "page-2": response_body(
            [section("pokemon", [pokemon_result("jolteon", 2, ["electric"])], 2)]
        ),
    }

    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(dict(request.url.params))
        return paged(pages)(request)

    outcome = search_with(contract, handler)
    assert [result.ref.name for result in outcome.results] == ["electrode", "jolteon"]
    assert seen[1] == {"q": "electric", "kind": "pokemon", "cursor": "page-2"}


@pytest.mark.parametrize(
    ("second_page", "message"),
    [
        (response_body([section("move", [move_result("thunder", 2)], 2)]), "that section only"),
        (
            response_body([section("pokemon", [pokemon_result("jolteon", 2, ["electric"])], 3)]),
            "total",
        ),
        (
            response_body([section("pokemon", [pokemon_result("jolteon", 5, ["electric"])], 2)]),
            "Ranks",
        ),
    ],
)
def test_inconsistent_pages_break_the_contract(
    contract: ContractValidator, second_page: dict[str, object], message: str
) -> None:
    pages = {
        None: response_body(
            [section("pokemon", [pokemon_result("electrode", 1, ["electric"])], 2, "page-2")]
        ),
        "page-2": second_page,
    }
    with pytest.raises(ContractViolationError, match=message):
        search_with(contract, paged(pages))


def test_a_total_that_is_never_reached_breaks_the_contract(contract: ContractValidator) -> None:
    body = response_body(
        [section("pokemon", [pokemon_result("electrode", 1, ["electric"])], total=2)]
    )
    with pytest.raises(ContractViolationError, match="announced 2"):
        search_with(contract, lambda request: httpx.Response(200, json=body))


def test_endless_pagination_is_stopped(contract: ContractValidator) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        rank = int(request.url.params.get("cursor", "0")) + 1
        body = response_body(
            [
                section(
                    "pokemon",
                    [pokemon_result(f"p{rank}", rank, ["electric"])],
                    10_000,
                    str(rank),
                )
            ]
        )
        return httpx.Response(200, json=body)

    with pytest.raises(ContractViolationError, match="exceeds"):
        search_with(contract, handler)


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
    body = response_body([section("pokemon", [result], total=1)])
    with pytest.raises(ContractViolationError, match="SearchResponse"):
        search_with(contract, lambda request: httpx.Response(200, json=body))


def test_reason_without_structured_fields_breaks_the_contract(
    contract: ContractValidator,
) -> None:
    result = pokemon_result("electrode", 1, ["electric"])
    result["reasons"] = [{"type": "effect", "detail": "Sleep", "related": None}]
    body = response_body([section("pokemon", [result], total=1)])
    with pytest.raises(ContractViolationError, match="SearchResponse"):
        search_with(contract, lambda request: httpx.Response(200, json=body))


def test_empty_outcome_requires_an_explanation(contract: ContractValidator) -> None:
    body = response_body([])
    body["explanation"] = None
    with pytest.raises(ContractViolationError):
        search_with(contract, lambda request: httpx.Response(200, json=body))


def test_results_outcome_requires_a_section(contract: ContractValidator) -> None:
    body = response_body([])
    body["outcome"] = "results"
    body["explanation"] = None
    with pytest.raises(ContractViolationError):
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


def test_entity_detail_and_suggestions_are_part_of_the_contract(
    contract: ContractValidator,
) -> None:
    contract.validate(
        {
            "kind": "ability",
            "id": 9,
            "name": "static",
            "short_effect": "Has a 30% chance of paralyzing attacking Pokémon on contact.",
            "effect": None,
            "generation": "generation-iii",
            "pokemon": ["pikachu", "raichu"],
        },
        "EntityDetail",
    )
    contract.validate(
        {
            "suggestions": [
                {
                    "kind": "concept",
                    "label": "Sleep (effect)",
                    "query": "sleep",
                    "entity": None,
                    "concept": {"role": "effect", "value": "sleep"},
                }
            ]
        },
        "SuggestResponse",
    )
    with pytest.raises(ContractViolationError):
        contract.validate({"kind": "ability", "name": "static"}, "EntityDetail")
