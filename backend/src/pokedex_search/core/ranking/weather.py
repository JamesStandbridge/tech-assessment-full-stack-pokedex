"""Score entities for a weather strategy."""

from pokedex_search.domain.entities import EntityKind, EntityRef, Frozen
from pokedex_search.domain.facts import SearchProfile, SourcedWeather, WeatherRole
from pokedex_search.domain.plan import WeatherConstraint

ROLE_WEIGHTS: dict[WeatherRole, float] = {
    WeatherRole.SETTER: 0.0,
    WeatherRole.BENEFIT: 1.0,
    WeatherRole.PROTECTION: 0.5,
    WeatherRole.MIXED: 0.5,
    WeatherRole.DRAWBACK: -0.5,
}
ROLE_ORDER: dict[WeatherRole, int] = {
    WeatherRole.SETTER: 0,
    WeatherRole.BENEFIT: 1,
    WeatherRole.PROTECTION: 2,
    WeatherRole.MIXED: 3,
    WeatherRole.DRAWBACK: 4,
}
MOVE_FACTOR = 0.5


class WeatherScore(Frozen):
    """How much an entity is worth for a weather strategy."""

    sets_weather: bool
    total: float
    facts: tuple[SourcedWeather, ...]

    @property
    def qualifies(self) -> bool:
        """Tell whether the entity belongs in a Pokémon ranking for the weather."""
        return self.sets_weather or self.total > 0


def weather_facts(
    profile: SearchProfile, constraint: WeatherConstraint
) -> tuple[SourcedWeather, ...]:
    """Return the facts of a profile about the weather, restricted to a raised stat if asked."""
    return tuple(
        item
        for item in profile.weathers
        if item.fact.weather == constraint.weather
        and (constraint.stat is None or item.fact.stat is constraint.stat)
    )


def _weight(item: SourcedWeather) -> float:
    factor = MOVE_FACTOR if item.source.kind is EntityKind.MOVE else 1.0
    return ROLE_WEIGHTS[item.fact.role] * factor


def score(profile: SearchProfile, constraint: WeatherConstraint) -> WeatherScore:
    """Score a Pokémon: setters first, then the weighted sum of its weather effects."""
    facts = weather_facts(profile, constraint)
    return WeatherScore(
        sets_weather=any(item.fact.role is WeatherRole.SETTER for item in facts),
        total=sum(_weight(item) for item in facts),
        facts=facts,
    )


def pokemon_key(weather_score: WeatherScore) -> tuple[float, ...]:
    """Return the ascending sort key of a Pokémon for a weather."""
    return (0.0 if weather_score.sets_weather else 1.0, -weather_score.total)


def entity_key(facts: tuple[SourcedWeather, ...], ref: EntityRef) -> tuple[float, ...]:
    """Return the ascending sort key of a move or ability by its best role."""
    own = [item for item in facts if item.source == ref] or list(facts)
    return (float(min(ROLE_ORDER[item.fact.role] for item in own)),)
