import pytest

from pokedex_search.application.pagination import PageRequest
from pokedex_search.application.query_validator import QueryValidator
from pokedex_search.application.ranking_service import MergedRanking
from pokedex_search.application.search_service import SearchRequest, SearchService
from pokedex_search.application.sections import SectionBuilder
from pokedex_search.domain.entities import EntityKind
from pokedex_search.domain.errors import InvalidParameterError, InvalidQueryError
from pokedex_search.domain.plan import SearchPlan
from pokedex_search.domain.results import RankedEntity, SearchOutcome
from tests.fakes.entities import pokemon
from tests.fakes.services import FakeComposer, FakeParser, FakeRanker, PlainCursorCodec

RANKED = tuple(
    RankedEntity(entity=pokemon(f"p{number}", number), reasons=()) for number in range(1, 6)
)
RANKING = MergedRanking(by_kind={EntityKind.POKEMON: RANKED}, approximate=False, fingerprint="fp")
EMPTY = MergedRanking(by_kind={}, approximate=False, fingerprint="fp")


def _service(ranking: MergedRanking = RANKING) -> SearchService:
    codec = PlainCursorCodec()
    return SearchService(
        QueryValidator(),
        FakeParser((SearchPlan(),)),
        FakeRanker(ranking),
        SectionBuilder(codec),
        codec,
        FakeComposer(),
    )


def _names(request: SearchRequest) -> list[str]:
    result = _service().search(request)
    return [item.entity.name for section in result.sections for item in section.items]


def test_the_query_is_trimmed_before_parsing() -> None:
    parser = FakeParser((SearchPlan(),))
    codec = PlainCursorCodec()
    service = SearchService(
        QueryValidator(), parser, FakeRanker(RANKING), SectionBuilder(codec), codec, FakeComposer()
    )
    assert service.search(SearchRequest(query="  bulba ")).query == "bulba"
    assert parser.received == ["bulba"]


@pytest.mark.parametrize("query", ["", "   ", "a", "x" * 201])
def test_invalid_queries_are_rejected(query: str) -> None:
    with pytest.raises(InvalidQueryError):
        _service().search(SearchRequest(query=query))


def test_pages_follow_their_cursor_until_the_end() -> None:
    first = _service().search(SearchRequest(query="all", page=PageRequest(limit=2)))
    section = first.sections[0]
    assert (section.total, [item.rank for item in section.items]) == (5, [1, 2])
    cursor = section.next_cursor
    assert cursor is not None
    later = PageRequest(kind=EntityKind.POKEMON, limit=2, cursor=cursor)
    assert _names(SearchRequest(query="all", page=later)) == ["p3", "p4"]


@pytest.mark.parametrize(
    "page",
    [
        PageRequest(limit=0),
        PageRequest(limit=101),
        PageRequest(kind=EntityKind.MOVE, cursor="pokemon|2|fp"),
        PageRequest(kind=EntityKind.POKEMON, cursor="pokemon|2|another"),
        PageRequest(kind=EntityKind.POKEMON, cursor="garbage"),
    ],
)
def test_invalid_pagination_is_rejected(page: PageRequest) -> None:
    with pytest.raises(InvalidParameterError):
        _service().search(SearchRequest(query="all", page=page))


def test_nothing_found_gives_an_empty_outcome() -> None:
    result = _service(EMPTY).search(SearchRequest(query="xyzzy"))
    assert result.outcome is SearchOutcome.EMPTY
    assert result.sections == ()
