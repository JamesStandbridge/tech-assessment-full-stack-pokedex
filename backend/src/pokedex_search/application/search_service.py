"""The search use case: validate, read, rank, paginate and compose."""

from pokedex_search.application.components import Composer, Ranker
from pokedex_search.application.pagination import MAX_LIMIT, Cursor, CursorCodec, PageRequest
from pokedex_search.application.ports import QueryParser
from pokedex_search.application.query_validator import QueryValidator
from pokedex_search.application.ranking_service import MergedRanking
from pokedex_search.application.sections import SectionBuilder, kind_order
from pokedex_search.domain.entities import Frozen
from pokedex_search.domain.errors import InvalidParameterError
from pokedex_search.domain.plan import SearchPlan
from pokedex_search.domain.results import SearchOutcome, SearchResult


class SearchRequest(Frozen):
    """A raw query and its pagination parameters."""

    query: str
    page: PageRequest = PageRequest()


class SearchService:
    """Answers search requests."""

    def __init__(
        self,
        validator: QueryValidator,
        parser: QueryParser,
        ranker: Ranker,
        sections: SectionBuilder,
        codec: CursorCodec,
        composer: Composer,
    ) -> None:
        """Keep the collaborators.

        Args:
            validator: Enforcer of the input rules.
            parser: Reader of queries.
            ranker: Ranker of plans.
            sections: Builder of paginated sections.
            codec: Decoder of cursors.
            composer: Builder of the interpretive parts of the response.
        """
        self._validator = validator
        self._parser = parser
        self._ranker = ranker
        self._sections = sections
        self._codec = codec
        self._composer = composer

    def search(self, request: SearchRequest) -> SearchResult:
        """Answer one request.

        Args:
            request: The raw query and pagination parameters.

        Returns:
            The complete response.

        Raises:
            InvalidQueryError: If the query breaks the input rules.
            InvalidParameterError: If a pagination parameter is invalid.
        """
        query = self._validator.validate(request.query)
        interpretation = self._parser.parse(query)
        ranking = self._ranker.rank(interpretation.alternatives)
        page = self._page(request.page, ranking)
        parts = self._composer.compose(interpretation, ranking)
        plans = parts.interpretation.alternatives
        order = kind_order(plans[0] if plans else SearchPlan())
        return SearchResult(
            query=query.text,
            canonical_query=parts.canonical_query,
            outcome=SearchOutcome.EMPTY if ranking.is_empty else SearchOutcome.RESULTS,
            interpretation=parts.interpretation,
            notices=parts.notices,
            explanation=parts.explanation,
            suggestions=parts.suggestions,
            best_match=parts.best_match,
            refinements=parts.refinements,
            sections=self._sections.build(
                ranking.by_kind, order, page, request.page.limit, ranking.fingerprint
            ),
        )

    def _page(self, request: PageRequest, ranking: MergedRanking) -> Cursor | None:
        if not 1 <= request.limit <= MAX_LIMIT:
            raise InvalidParameterError(f"The limit must be between 1 and {MAX_LIMIT}.")
        if request.cursor is None:
            if request.kind is None:
                return None
            return Cursor(kind=request.kind, offset=0, fingerprint=ranking.fingerprint)
        cursor = self._codec.decode(request.cursor)
        if cursor.fingerprint != ranking.fingerprint or cursor.kind != request.kind:
            raise InvalidParameterError("The cursor does not belong to this query and kind.")
        return cursor
