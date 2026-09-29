from collections.abc import Sequence

from pokedex_search.application.composer import ResponseParts
from pokedex_search.application.pagination import Cursor
from pokedex_search.application.ranking_service import MergedRanking
from pokedex_search.application.search_service import SearchRequest
from pokedex_search.domain.details import EntityDetail
from pokedex_search.domain.entities import EntityKind, EntityRef
from pokedex_search.domain.errors import EntityNotFoundError, InvalidParameterError
from pokedex_search.domain.plan import SearchPlan
from pokedex_search.domain.query import ValidQuery
from pokedex_search.domain.results import Interpretation, SearchResult
from pokedex_search.domain.suggestions import TypingSuggestion


class FakeParser:
    def __init__(self, plans: tuple[SearchPlan, ...]) -> None:
        self._plans = plans
        self.received: list[str] = []

    def parse(self, query: ValidQuery) -> Interpretation:
        self.received.append(query.text)
        return Interpretation(terms=(), alternatives=self._plans, summary="fake")


class FakeRanker:
    def __init__(self, ranking: MergedRanking) -> None:
        self._ranking = ranking

    def rank(self, plans: Sequence[SearchPlan]) -> MergedRanking:
        return self._ranking


class FakeComposer:
    def compose(self, interpretation: Interpretation, ranking: MergedRanking) -> ResponseParts:
        return ResponseParts(
            interpretation=interpretation,
            canonical_query=None,
            notices=(),
            explanation=None if not ranking.is_empty else "empty",
            suggestions=(),
            best_match=None,
            refinements=(),
        )


class PlainCursorCodec:
    def encode(self, cursor: Cursor) -> str:
        return f"{cursor.kind}|{cursor.offset}|{cursor.fingerprint}"

    def decode(self, token: str) -> Cursor:
        try:
            kind, offset, fingerprint = token.split("|")
            return Cursor(kind=EntityKind(kind), offset=int(offset), fingerprint=fingerprint)
        except ValueError as error:
            raise InvalidParameterError("bad cursor") from error


class FakeSearch:
    def __init__(self, result: SearchResult | Exception) -> None:
        self._result = result
        self.requests: list[SearchRequest] = []

    def search(self, request: SearchRequest) -> SearchResult:
        self.requests.append(request)
        if isinstance(self._result, Exception):
            raise self._result
        return self._result


class FakeEntities:
    def __init__(self, details: dict[EntityRef, EntityDetail]) -> None:
        self._details = details

    def get(self, kind: EntityKind, name: str) -> EntityDetail:
        ref = EntityRef(kind=kind, name=name)
        if ref not in self._details:
            raise EntityNotFoundError(ref)
        return self._details[ref]


class FakeSuggest:
    def suggest(self, partial: str) -> tuple[TypingSuggestion, ...]:
        return ()


class FakeHealth:
    def dataset_version(self) -> str:
        return "fake-version"
