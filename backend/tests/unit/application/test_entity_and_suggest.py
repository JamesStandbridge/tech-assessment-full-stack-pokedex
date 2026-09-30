import pytest

from pokedex_search.application.entity_service import EntityService
from pokedex_search.application.query_validator import QueryValidator
from pokedex_search.application.suggest_service import SuggestService
from pokedex_search.domain.entities import EntityKind
from pokedex_search.domain.errors import EntityNotFoundError, InvalidQueryError
from pokedex_search.domain.suggestions import TypingSuggestion, TypingSuggestionKind
from pokedex_search.domain.terms import TermRole
from tests.fakes.entities import move, pokemon
from tests.fakes.index import FakeIndex

INDEX = FakeIndex([pokemon("pikachu", 25), pokemon("pidgey", 16), move("thunder", 87)])


class FakeConcepts:
    def complete(self, partial: str, limit: int) -> tuple[TypingSuggestion, ...]:
        return (
            TypingSuggestion(
                kind=TypingSuggestionKind.CONCEPT,
                label="psychic (type)",
                query="psychic",
                concept_role=TermRole.TYPE,
                concept_value="psychic",
            ),
        )[:limit]


def test_entity_details_include_the_evolution_family() -> None:
    detail = EntityService(INDEX).get(EntityKind.POKEMON, "pikachu")
    assert detail.entity.name == "pikachu"
    assert detail.evolution_family == ("pikachu",)
    assert EntityService(INDEX).get(EntityKind.MOVE, "thunder").evolution_family == ()


def test_the_species_list_holds_every_pokemon_in_pokedex_order() -> None:
    assert [pokemon.name for pokemon in EntityService(INDEX).species()] == ["pidgey", "pikachu"]


def test_a_missing_entity_is_reported() -> None:
    with pytest.raises(EntityNotFoundError, match="rain-dance"):
        EntityService(INDEX).get(EntityKind.MOVE, "rain-dance")


def test_suggestions_list_names_starting_with_the_input_then_concepts() -> None:
    service = SuggestService(QueryValidator(), INDEX, FakeConcepts())
    suggestions = service.suggest("pi")
    assert [item.label for item in suggestions] == [
        "pidgey (pokemon)",
        "pikachu (pokemon)",
        "psychic (type)",
    ]


def test_suggestions_follow_the_input_rules() -> None:
    with pytest.raises(InvalidQueryError):
        SuggestService(QueryValidator(), INDEX, FakeConcepts()).suggest("p")
