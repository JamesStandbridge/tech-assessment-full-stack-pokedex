import pytest

from pokedex_search.core.ranking.effects import best_effect, effect_key, matching_effects
from pokedex_search.core.ranking.names import NamedEntity, NameMatcher, NameTier
from pokedex_search.core.ranking.stats import Percentiles, satisfies, sort_key
from pokedex_search.core.ranking.weather import pokemon_key, score
from pokedex_search.domain.entities import EntityKind, EntityRef
from pokedex_search.domain.facts import (
    EffectFact,
    EffectMode,
    EffectTarget,
    SearchProfile,
    SourcedEffect,
    SourcedWeather,
    WeatherFact,
    WeatherRole,
)
from pokedex_search.domain.plan import (
    Comparator,
    EffectConstraint,
    SortDirection,
    StatFilter,
    StatSort,
    WeatherConstraint,
)
from pokedex_search.domain.stats import StatName

POKEMON = frozenset({EntityKind.POKEMON})


def _named(*names: str) -> NameMatcher:
    return NameMatcher(
        NamedEntity(ref=EntityRef(kind=EntityKind.POKEMON, name=name), key=name, id=index)
        for index, name in enumerate(names, start=1)
    )


def test_exact_beats_prefix_beats_infix() -> None:
    matches = _named("kadabra", "mewtwo", "abra", "mew").match("abra", POKEMON)
    assert [(m.ref.name, m.tier) for m in matches] == [
        ("abra", NameTier.EXACT),
        ("kadabra", NameTier.INFIX),
    ]
    assert [m.ref.name for m in _named("mewtwo", "mew").match("mew", POKEMON)] == ["mew", "mewtwo"]


@pytest.mark.parametrize(("term", "found"), [("bulbsaur", True), ("bulbazzzz", False)])
def test_typos_are_bounded(term: str, found: bool) -> None:
    matches = _named("bulbasaur").match(term, POKEMON)
    assert bool(matches) is found
    assert all(match.tier is NameTier.FUZZY for match in matches)


def test_typos_only_apply_without_a_literal_match() -> None:
    assert [m.tier for m in _named("pikachu", "pikachuu").match("pikachuu", POKEMON)] == [
        NameTier.EXACT
    ]


def test_percentiles_use_mid_ranks() -> None:
    assert Percentiles([10, 20, 20, 30]).rank(20) == pytest.approx(0.5)


@pytest.mark.parametrize(
    ("comparator", "expected"),
    [
        (Comparator.GT, False),
        (Comparator.GTE, True),
        (Comparator.LT, False),
        (Comparator.LTE, True),
    ],
)
def test_comparisons_are_strict_or_inclusive(comparator: Comparator, expected: bool) -> None:
    assert (
        satisfies(100, StatFilter(stat=StatName.SPEED, comparator=comparator, value=100))
        is expected
    )


def test_several_stats_rank_by_mean_percentile() -> None:
    sorts = [
        StatSort(stat=StatName.SPEED, direction=SortDirection.DESC),
        StatSort(stat=StatName.OFFENSE, direction=SortDirection.DESC),
    ]
    tables = {StatName.SPEED: Percentiles([1, 2, 3]), StatName.OFFENSE: Percentiles([1, 2, 3])}
    balanced = sort_key({StatName.SPEED: 2, StatName.OFFENSE: 3}, sorts, tables)
    lopsided = sort_key({StatName.SPEED: 3, StatName.OFFENSE: 1}, sorts, tables)
    assert balanced < lopsided


def _weather(source: EntityRef, role: WeatherRole) -> SourcedWeather:
    return SourcedWeather(fact=WeatherFact(weather="rain", role=role, stat=None), source=source)


def test_weather_score_halves_moves_and_puts_setters_first() -> None:
    ability = EntityRef(kind=EntityKind.ABILITY, name="rain-dish")
    thunder = EntityRef(kind=EntityKind.MOVE, name="thunder")
    solar = EntityRef(kind=EntityKind.MOVE, name="solar-beam")
    rain = WeatherConstraint(weather="rain", stat=None)
    profile = SearchProfile(
        ref=EntityRef(kind=EntityKind.POKEMON, name="lapras"),
        effects=(),
        weathers=(
            _weather(ability, WeatherRole.BENEFIT),
            _weather(thunder, WeatherRole.BENEFIT),
            _weather(solar, WeatherRole.DRAWBACK),
        ),
    )
    assert score(profile, rain).total == pytest.approx(1 + 0.5 - 0.25)
    setter = SearchProfile(
        ref=profile.ref, effects=(), weathers=(_weather(ability, WeatherRole.SETTER),)
    )
    assert pokemon_key(score(setter, rain)) < pokemon_key(score(profile, rain))


def _poisoning(source: str, probability: float) -> SourcedEffect:
    fact = EffectFact(
        effect="poison",
        mode=EffectMode.CAUSES,
        target=EffectTarget.OPPONENT,
        probability=probability,
    )
    return SourcedEffect(fact=fact, source=EntityRef(kind=EntityKind.MOVE, name=source))


def _poison_key(*effects: SourcedEffect) -> tuple[float, ...]:
    profile = SearchProfile(
        ref=EntityRef(kind=EntityKind.POKEMON, name="ekans"), effects=effects, weathers=()
    )
    constraint = EffectConstraint(
        effect="poison", mode=EffectMode.CAUSES, target=EffectTarget.OPPONENT
    )
    matches = matching_effects(profile, constraint)
    best = best_effect(matches)
    assert best is not None
    return effect_key(best, matches)


def test_effects_rank_by_best_probability_then_by_number_of_sources() -> None:
    toxic = _poisoning("toxic", 0.9)
    sting = _poisoning("poison-sting", 0.3)
    powder = _poisoning("poison-powder", 0.75)
    assert _poison_key(toxic, sting) < _poison_key(toxic) < _poison_key(powder, sting)
