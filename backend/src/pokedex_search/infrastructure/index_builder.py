"""Build every structure of the in-memory index once, from the snapshot and profiles."""

from collections.abc import Iterable

from pydantic import BaseModel, ConfigDict

from pokedex_search.application.facets import Facet, FacetName, effect_facet
from pokedex_search.core.query.normalizer import name_key
from pokedex_search.core.query.tokenizer import tokenize
from pokedex_search.core.ranking.names import NamedEntity
from pokedex_search.domain.entities import Entity, EntityKind, EntityRef, Move, Pokemon, Snapshot
from pokedex_search.domain.facts import SearchProfile, WeatherRole
from pokedex_search.domain.stats import StatName, stat_kind, stat_value

_GENUS_SUFFIX = "pokemon"
TRUE = "true"


class IndexData(BaseModel):
    """Immutable structures the in-memory index answers from."""

    model_config = ConfigDict(frozen=True)

    version: str
    entities: dict[EntityRef, Entity]
    refs_by_kind: dict[EntityKind, frozenset[EntityRef]]
    families: dict[int, tuple[str, ...]]
    facets: dict[Facet, frozenset[EntityRef]]
    names: tuple[NamedEntity, ...]
    stat_values: dict[StatName, tuple[int, ...]]
    profiles: dict[EntityRef, SearchProfile]


def _pokemon_facets(pokemon: Pokemon) -> Iterable[Facet]:
    yield from (Facet(name=FacetName.TYPE, value=name) for name in pokemon.types)
    species = pokemon.species
    genus = tokenize(species.genus or "")
    yield from (
        Facet(name=FacetName.GENUS, value=token.word)
        for token in genus
        if token.word != _GENUS_SUFFIX
    )
    yield Facet(name=FacetName.COLOR, value=species.color)
    if species.habitat:
        yield Facet(name=FacetName.HABITAT, value=species.habitat)
    if species.is_legendary:
        yield Facet(name=FacetName.LEGENDARY, value=TRUE)
    if species.is_mythical:
        yield Facet(name=FacetName.MYTHICAL, value=TRUE)
    yield from (Facet(name=FacetName.LEARNS_MOVE, value=name) for name in pokemon.moves)
    yield from (Facet(name=FacetName.HAS_ABILITY, value=name) for name in pokemon.abilities)


def _entity_facets(entity: Entity) -> Iterable[Facet]:
    if isinstance(entity, Pokemon):
        yield from _pokemon_facets(entity)
    elif isinstance(entity, Move):
        yield Facet(name=FacetName.TYPE, value=entity.type)
        yield Facet(name=FacetName.DAMAGE_CLASS, value=entity.damage_class)
        yield from (Facet(name=FacetName.LEARNED_BY, value=name) for name in entity.learned_by)
    else:
        yield from (Facet(name=FacetName.CARRIED_BY, value=name) for name in entity.pokemon)


def _profile_facets(profile: SearchProfile) -> Iterable[Facet]:
    for effect in profile.effects:
        yield effect_facet(effect.fact.effect, effect.fact.mode, effect.fact.target)
    for weather in profile.weathers:
        yield Facet(name=FacetName.WEATHER, value=weather.fact.weather)
        if weather.fact.role is WeatherRole.SETTER:
            yield Facet(name=FacetName.WEATHER_SETTER, value=weather.fact.weather)


def _facets(
    entities: Iterable[Entity], profiles: dict[EntityRef, SearchProfile]
) -> dict[Facet, frozenset[EntityRef]]:
    index: dict[Facet, set[EntityRef]] = {}
    for entity in entities:
        facets = [*_entity_facets(entity)]
        if entity.ref in profiles:
            facets += _profile_facets(profiles[entity.ref])
        for facet in facets:
            index.setdefault(facet, set()).add(entity.ref)
    return {facet: frozenset(refs) for facet, refs in index.items()}


def _stat_values(entities: Iterable[Entity]) -> dict[StatName, tuple[int, ...]]:
    values: dict[StatName, list[int]] = {}
    for entity in entities:
        for stat in StatName:
            value = stat_value(entity, stat) if entity.ref.kind is stat_kind(stat) else None
            if value is not None:
                values.setdefault(stat, []).append(value)
    return {stat: tuple(sorted(items)) for stat, items in values.items()}


def build_index_data(snapshot: Snapshot, profiles: dict[EntityRef, SearchProfile]) -> IndexData:
    """Prepare every structure of the index.

    Args:
        snapshot: The dataset.
        profiles: Search profiles of every entity.

    Returns:
        The immutable index data.
    """
    entities: tuple[Entity, ...] = (*snapshot.pokemon, *snapshot.moves, *snapshot.abilities)
    families: dict[int, list[str]] = {}
    for pokemon in snapshot.pokemon:
        if pokemon.species.evolution_chain_id is not None:
            families.setdefault(pokemon.species.evolution_chain_id, []).append(pokemon.name)
    return IndexData(
        version=snapshot.sha256,
        entities={entity.ref: entity for entity in entities},
        refs_by_kind={
            kind: frozenset(entity.ref for entity in entities if entity.ref.kind is kind)
            for kind in EntityKind
        },
        families={chain: tuple(names) for chain, names in families.items()},
        facets=_facets(entities, profiles),
        names=tuple(
            NamedEntity(ref=entity.ref, key=name_key(entity.name), id=entity.id)
            for entity in entities
        ),
        stat_values=_stat_values(entities),
        profiles=profiles,
    )
