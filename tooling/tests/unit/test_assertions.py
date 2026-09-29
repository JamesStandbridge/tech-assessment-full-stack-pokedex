import pytest

from pokedex_tooling.assertions import (
    assert_best_match,
    assert_count_of_kind,
    assert_every_pokemon_has_type,
    assert_every_result_of_kind,
    assert_excludes,
    assert_first,
    assert_has_explanation,
    assert_in_order,
    assert_includes,
    assert_notice,
    assert_outcome,
    assert_ranks_before,
    assert_term_role,
    assert_within_first_of_kind,
)
from pokedex_tooling.client import Notice, Outcome, RankedResult, SearchOutcome, Term
from pokedex_tooling.entities import EntityKind, EntityRef

POKEMON_TYPES: dict[str, list[str]] = {
    "electrode": ["electric"],
    "jolteon": ["electric"],
    "zapdos": ["electric", "flying"],
    "aerodactyl": ["rock", "flying"],
}


def ref(value: str) -> EntityRef:
    return EntityRef.parse(value)


def outcome_of(*refs: str, explanation: str | None = None) -> SearchOutcome:
    results = [
        RankedResult(
            ref=ref(value),
            rank=rank,
            types=POKEMON_TYPES.get(ref(value).name, []) if value.startswith("pokemon:") else [],
        )
        for rank, value in enumerate(refs, start=1)
    ]
    return SearchOutcome(
        query="test",
        outcome=Outcome.RESULTS if results else Outcome.EMPTY,
        explanation=explanation,
        results=results,
    )


def test_outcome_mismatch_names_the_expected_outcome() -> None:
    with pytest.raises(AssertionError, match="Expected outcome empty"):
        assert_outcome(outcome_of("move:spore"), Outcome.EMPTY)


def test_first_result_is_compared_overall() -> None:
    outcome = outcome_of("move:thunder", "pokemon:electrode")
    assert_first(outcome, ref("move:thunder"))
    with pytest.raises(AssertionError):
        assert_first(outcome, ref("pokemon:electrode"))


def test_first_result_fails_on_empty_results() -> None:
    with pytest.raises(AssertionError):
        assert_first(outcome_of(), ref("pokemon:mew"))


def test_within_first_counts_only_results_of_the_same_kind() -> None:
    outcome = outcome_of("move:thunder", "move:thunderbolt", "pokemon:electrode", "pokemon:jolteon")
    assert_within_first_of_kind(outcome, ref("pokemon:electrode"), 1)
    with pytest.raises(AssertionError, match="found at 2"):
        assert_within_first_of_kind(outcome, ref("pokemon:jolteon"), 1)


def test_within_first_fails_when_absent() -> None:
    with pytest.raises(AssertionError, match="in the results"):
        assert_within_first_of_kind(outcome_of("pokemon:jolteon"), ref("pokemon:mew"), 3)


def test_includes_and_excludes_list_the_offending_entities() -> None:
    outcome = outcome_of("move:spore", "move:rest")
    assert_includes(outcome, [ref("move:spore")])
    assert_excludes(outcome, [ref("move:sing")])
    with pytest.raises(AssertionError, match=r"move:sing"):
        assert_includes(outcome, [ref("move:spore"), ref("move:sing")])
    with pytest.raises(AssertionError, match=r"move:rest"):
        assert_excludes(outcome, [ref("move:rest")])


def test_ranks_before_passes_when_the_second_entity_is_absent() -> None:
    assert_ranks_before(outcome_of("pokemon:abra"), ref("pokemon:abra"), ref("pokemon:kadabra"))


def test_ranks_before_requires_the_first_entity() -> None:
    with pytest.raises(AssertionError, match="pokemon:abra in the results"):
        assert_ranks_before(
            outcome_of("pokemon:kadabra"), ref("pokemon:abra"), ref("pokemon:kadabra")
        )


def test_ranks_before_detects_the_wrong_order() -> None:
    with pytest.raises(AssertionError, match="before"):
        assert_ranks_before(
            outcome_of("pokemon:kadabra", "pokemon:abra"),
            ref("pokemon:abra"),
            ref("pokemon:kadabra"),
        )


def test_ranks_before_uses_the_overall_rank_across_kinds() -> None:
    outcome = outcome_of("pokemon:drowzee", "ability:insomnia", "move:spore")
    assert_ranks_before(outcome, ref("ability:insomnia"), ref("move:spore"))
    with pytest.raises(AssertionError):
        assert_ranks_before(outcome, ref("move:spore"), ref("ability:insomnia"))


def test_in_order_ignores_other_entities_between_the_listed_ones() -> None:
    outcome = outcome_of("pokemon:electrode", "move:thunder", "pokemon:zapdos", "pokemon:jolteon")
    assert_in_order(outcome, [ref("pokemon:electrode"), ref("pokemon:jolteon")])
    with pytest.raises(AssertionError, match="order"):
        assert_in_order(outcome, [ref("pokemon:jolteon"), ref("pokemon:electrode")])


def test_in_order_requires_every_entity() -> None:
    with pytest.raises(AssertionError, match="Missing"):
        assert_in_order(
            outcome_of("pokemon:electrode"), [ref("pokemon:electrode"), ref("pokemon:jolteon")]
        )


def test_type_constraint_applies_to_pokemon_only() -> None:
    assert_every_pokemon_has_type(outcome_of("pokemon:zapdos", "move:thunder"), "electric")
    with pytest.raises(AssertionError, match="pokemon:aerodactyl"):
        assert_every_pokemon_has_type(
            outcome_of("pokemon:zapdos", "pokemon:aerodactyl"), "electric"
        )


def test_explanation_must_not_be_blank() -> None:
    assert_has_explanation(outcome_of(explanation="No Pokémon has the Dark type."))
    with pytest.raises(AssertionError):
        assert_has_explanation(outcome_of(explanation="  "))
    with pytest.raises(AssertionError):
        assert_has_explanation(outcome_of())


def understood(best_match: str | None = None) -> SearchOutcome:
    return outcome_of("move:thunder").model_copy(
        update={
            "terms": [
                Term(text="Rain", role="weather", value="rain"),
                Term(text="brock", role="ignored", value=None),
            ],
            "notices": [Notice(code="ignored-terms", message="Ignored: brock.")],
            "best_match": ref(best_match) if best_match else None,
        }
    )


def test_term_roles_are_matched_ignoring_case() -> None:
    assert_term_role(understood(), "rain", "weather")
    assert_term_role(understood(), "brock", "ignored")
    with pytest.raises(AssertionError, match="as effect"):
        assert_term_role(understood(), "rain", "effect")
    with pytest.raises(AssertionError, match="in the response terms"):
        assert_term_role(understood(), "misty", "name")


def test_notices_are_matched_by_code() -> None:
    assert_notice(understood(), "ignored-terms")
    with pytest.raises(AssertionError, match="missing-mechanic"):
        assert_notice(understood(), "missing-mechanic")


def test_best_match_is_compared_exactly() -> None:
    assert_best_match(understood("move:thunder"), ref("move:thunder"))
    assert_best_match(understood(), None)
    with pytest.raises(AssertionError, match="best match"):
        assert_best_match(understood("move:thunder"), None)


def test_every_result_of_kind_requires_results_of_that_kind_only() -> None:
    assert_every_result_of_kind(outcome_of("move:thunder", "move:thunderbolt"), EntityKind.MOVE)
    with pytest.raises(AssertionError, match="pokemon:jolteon"):
        assert_every_result_of_kind(outcome_of("move:thunder", "pokemon:jolteon"), EntityKind.MOVE)
    with pytest.raises(AssertionError, match="Expected move results"):
        assert_every_result_of_kind(outcome_of(), EntityKind.MOVE)


def test_count_of_kind_counts_only_that_kind() -> None:
    outcome = outcome_of("pokemon:jolteon", "move:thunder", "pokemon:zapdos")
    assert_count_of_kind(outcome, EntityKind.POKEMON, 2)
    with pytest.raises(AssertionError, match="Expected 3 pokemon results, got 2"):
        assert_count_of_kind(outcome, EntityKind.POKEMON, 3)
