"""Denormalize facts: every Pokémon carries the facts of its moves and abilities."""

from pokedex_search.core.enrichment.effect_classifier import EffectClassifier
from pokedex_search.core.enrichment.weather_classifier import WeatherClassifier
from pokedex_search.domain.entities import Ability, EntityKind, EntityRef, Move, Snapshot
from pokedex_search.domain.facts import (
    EntityFacts,
    SearchProfile,
    SourcedEffect,
    SourcedWeather,
)


def extract_facts(
    snapshot: Snapshot, effects: EffectClassifier, weathers: WeatherClassifier
) -> dict[EntityRef, EntityFacts]:
    """Read the facts of every move and ability.

    Args:
        snapshot: The dataset.
        effects: Status effect classifier.
        weathers: Weather classifier.

    Returns:
        Facts by move or ability reference.
    """
    entities: tuple[Move | Ability, ...] = (*snapshot.moves, *snapshot.abilities)
    return {
        entity.ref: EntityFacts(
            effects=effects.classify(entity), weathers=weathers.classify(entity)
        )
        for entity in entities
    }


def _sourced(ref: EntityRef, facts: EntityFacts) -> SearchProfile:
    return SearchProfile(
        ref=ref,
        effects=tuple(SourcedEffect(fact=fact, source=ref) for fact in facts.effects),
        weathers=tuple(SourcedWeather(fact=fact, source=ref) for fact in facts.weathers),
    )


def build_profiles(
    snapshot: Snapshot, facts: dict[EntityRef, EntityFacts]
) -> dict[EntityRef, SearchProfile]:
    """Build the search profile of every entity.

    Args:
        snapshot: The dataset.
        facts: Facts of every move and ability.

    Returns:
        Profiles by entity reference.
    """
    profiles = {ref: _sourced(ref, entity_facts) for ref, entity_facts in facts.items()}
    for pokemon in snapshot.pokemon:
        sources = [EntityRef(kind=EntityKind.MOVE, name=name) for name in pokemon.moves] + [
            EntityRef(kind=EntityKind.ABILITY, name=name) for name in pokemon.abilities
        ]
        reached = [profiles[source] for source in sources if source in profiles]
        profiles[pokemon.ref] = SearchProfile(
            ref=pokemon.ref,
            effects=tuple(item for profile in reached for item in profile.effects),
            weathers=tuple(item for profile in reached for item in profile.weathers),
        )
    return profiles
