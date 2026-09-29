"""What a search returns."""

from enum import StrEnum

from pokedex_search.domain.entities import Entity, EntityKind, EntityRef, Frozen
from pokedex_search.domain.facts import EffectMode, EffectTarget, WeatherRole
from pokedex_search.domain.plan import SearchPlan
from pokedex_search.domain.terms import Term


class ReasonType(StrEnum):
    """Why a result matched."""

    NAME_EXACT = "name-exact"
    NAME_PREFIX = "name-prefix"
    NAME_INFIX = "name-infix"
    NAME_FUZZY = "name-fuzzy"
    DEX_NUMBER = "dex-number"
    TYPE_FILTER = "type-filter"
    CHARACTERISTIC = "characteristic"
    STAT_RANK = "stat-rank"
    STAT_FILTER = "stat-filter"
    EFFECT = "effect"
    WEATHER = "weather"
    LEARNS_MOVE = "learns-move"
    HAS_ABILITY = "has-ability"
    LEARNED_BY = "learned-by"
    CARRIED_BY = "carried-by"
    DESCRIPTION_MATCH = "description-match"


class Reason(Frozen):
    """One reason a result matched, with structured facts for the interface."""

    type: ReasonType
    detail: str
    related: EntityRef | None = None
    probability: float | None = None
    mode: EffectMode | None = None
    target: EffectTarget | None = None
    weather_role: WeatherRole | None = None


class RankedEntity(Frozen):
    """A result entity with its reasons, before pagination."""

    entity: Entity
    reasons: tuple[Reason, ...]


class SectionItem(Frozen):
    """A result entity at its rank within its section."""

    rank: int
    entity: Entity
    reasons: tuple[Reason, ...]


class Section(Frozen):
    """One page of the results of one entity kind."""

    kind: EntityKind
    total: int
    items: tuple[SectionItem, ...]
    next_cursor: str | None


class NoticeCode(StrEnum):
    """Stable identifiers of notices."""

    IGNORED_TERMS = "ignored-terms"
    APPROXIMATE_MATCH = "approximate-match"
    MISSING_MECHANIC = "missing-mechanic"


class Notice(Frozen):
    """An honest caveat about a response."""

    code: NoticeCode
    message: str


class SuggestionKind(StrEnum):
    """Kinds of suggestion offered on an empty outcome."""

    NAME = "name"
    EXAMPLE = "example"


class Suggestion(Frozen):
    """A query the user may try instead."""

    kind: SuggestionKind
    label: str
    query: str


class RefinementAction(StrEnum):
    """How a refinement changes a constraint."""

    ADD = "add"
    REMOVE = "remove"
    REPLACE = "replace"


class Refinement(Frozen):
    """A ready-to-run adjustment of one recognized constraint."""

    constraint: str
    action: RefinementAction
    label: str
    query: str


class Interpretation(Frozen):
    """How a query was read: its terms and its alternative plans."""

    terms: tuple[Term, ...]
    alternatives: tuple[SearchPlan, ...]
    summary: str


class SearchOutcome(StrEnum):
    """Whether anything answers a valid query."""

    RESULTS = "results"
    EMPTY = "empty"


class SearchResult(Frozen):
    """The complete answer to one search request."""

    query: str
    canonical_query: str | None
    outcome: SearchOutcome
    interpretation: Interpretation
    notices: tuple[Notice, ...]
    explanation: str | None
    suggestions: tuple[Suggestion, ...]
    best_match: EntityRef | None
    refinements: tuple[Refinement, ...]
    sections: tuple[Section, ...]
