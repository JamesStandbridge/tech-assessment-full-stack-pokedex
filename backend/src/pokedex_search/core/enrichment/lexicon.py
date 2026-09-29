"""Typed model of the lexicon resource that turns effect texts into facts."""

from enum import StrEnum

from pokedex_search.domain.entities import Frozen
from pokedex_search.domain.facts import EffectMode, EffectTarget, WeatherRole
from pokedex_search.domain.stats import StatName


class ProbabilitySource(StrEnum):
    """Where the probability of an effect comes from."""

    MOVE = "move"
    PERCENT = "percent"
    NONE = "none"


class WeatherScope(StrEnum):
    """Which weathers a weather rule applies to."""

    MENTIONED = "mentioned"
    ALL = "all"
    DAMAGING = "damaging"


class EffectRule(Frozen):
    """A pattern of short effect and the fact it expresses about the statuses it names."""

    pattern: str
    mode: EffectMode
    target: EffectTarget | None
    probability: ProbabilitySource


class WeatherRule(Frozen):
    """A pattern of weather clause and the role it expresses."""

    pattern: str
    role: WeatherRole
    scope: WeatherScope


class Lexicon(Frozen):
    """Every rule used to extract facts, in precedence order."""

    statuses: dict[str, tuple[str, ...]]
    effect_rules: tuple[EffectRule, ...]
    weathers: dict[str, tuple[str, ...]]
    generic_weather: str
    damaging_weathers: tuple[str, ...]
    ignored_sentences: tuple[str, ...]
    weather_rules: tuple[WeatherRule, ...]
    weather_stats: dict[StatName, str]
