"""Query terms and the roles they are recognized in."""

from enum import StrEnum

from pokedex_search.domain.entities import Frozen


class TermRole(StrEnum):
    """Roles a query term can play."""

    NAME = "name"
    DEX_NUMBER = "dex-number"
    KIND = "kind"
    TYPE = "type"
    CHARACTERISTIC = "characteristic"
    STAT = "stat"
    DIRECTION = "direction"
    COMPARATOR = "comparator"
    NUMBER = "number"
    EFFECT = "effect"
    MODE = "mode"
    TARGET = "target"
    WEATHER = "weather"
    RELATION = "relation"
    FILLER = "filler"
    IGNORED = "ignored"


class Term(Frozen):
    """A term of the query as written, with its role and normalized value."""

    text: str
    role: TermRole
    value: str | None
