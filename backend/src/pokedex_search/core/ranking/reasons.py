"""Build the reasons that explain why a result matched."""

from pokedex_search.core.ranking.names import NameMatch, NameTier
from pokedex_search.domain.entities import EntityKind, EntityRef
from pokedex_search.domain.facts import SourcedEffect, SourcedWeather, WeatherRole
from pokedex_search.domain.plan import (
    Characteristic,
    RelationConstraint,
    RelationPredicate,
    StatFilter,
    StatSort,
)
from pokedex_search.domain.results import Reason, ReasonType

_NAME_REASONS = {
    NameTier.EXACT: (ReasonType.NAME_EXACT, "Exact name"),
    NameTier.PREFIX: (ReasonType.NAME_PREFIX, "Name starts with the query"),
    NameTier.INFIX: (ReasonType.NAME_INFIX, "Name contains the query"),
    NameTier.FUZZY: (ReasonType.NAME_FUZZY, "Name close to the query"),
}
_ROLE_LABELS = {
    WeatherRole.SETTER: "sets",
    WeatherRole.BENEFIT: "benefits from",
    WeatherRole.PROTECTION: "is protected from",
    WeatherRole.MIXED: "is partly helped by",
    WeatherRole.DRAWBACK: "is hindered by",
}
_RELATION_REASONS = {
    RelationPredicate.LEARNS_MOVE: (ReasonType.LEARNS_MOVE, "Learns"),
    RelationPredicate.HAS_ABILITY: (ReasonType.HAS_ABILITY, "Has the ability"),
    RelationPredicate.LEARNED_BY: (ReasonType.LEARNED_BY, "Learned by"),
    RelationPredicate.CARRIED_BY: (ReasonType.CARRIED_BY, "Carried by"),
}


def name_reason(match: NameMatch) -> Reason:
    """Explain a name match."""
    reason_type, label = _NAME_REASONS[match.tier]
    return Reason(type=reason_type, detail=label)


def dex_reason(number: int) -> Reason:
    """Explain a Pokédex number match."""
    return Reason(type=ReasonType.DEX_NUMBER, detail=f"Pokédex number {number}")


def type_reason(types: tuple[str, ...]) -> Reason:
    """Explain a type filter."""
    return Reason(type=ReasonType.TYPE_FILTER, detail=f"Type {' and '.join(types)}")


def characteristic_reason(characteristic: Characteristic) -> Reason:
    """Explain a characteristic filter."""
    return Reason(
        type=ReasonType.CHARACTERISTIC, detail=f"{characteristic.facet}: {characteristic.value}"
    )


def stat_rank_reason(sort: StatSort, value: int) -> Reason:
    """Explain a stat ranking."""
    return Reason(type=ReasonType.STAT_RANK, detail=f"{sort.stat} {value}")


def stat_filter_reason(rule: StatFilter, value: int) -> Reason:
    """Explain a stat comparison."""
    return Reason(
        type=ReasonType.STAT_FILTER, detail=f"{rule.stat} {value} ({rule.comparator} {rule.value})"
    )


def effect_reason(effect: SourcedEffect, own: EntityRef) -> Reason:
    """Explain an effect match, naming the source when it is another entity."""
    fact = effect.fact
    chance = "" if fact.probability is None else f", {round(fact.probability * 100)}% chance"
    source = "" if effect.source == own else f" through {effect.source.name}"
    return Reason(
        type=ReasonType.EFFECT,
        detail=f"{fact.mode.capitalize()} {fact.effect.replace('-', ' ')}{chance}{source}",
        related=None if effect.source == own else effect.source,
        probability=fact.probability,
        mode=fact.mode,
        target=fact.target,
    )


def weather_reason(item: SourcedWeather, own: EntityRef) -> Reason:
    """Explain a weather relation, naming the source when it is another entity."""
    source = "" if item.source == own else f" through {item.source.name}"
    raised = f", raises {item.fact.stat}" if item.fact.stat else ""
    return Reason(
        type=ReasonType.WEATHER,
        detail=f"{_ROLE_LABELS[item.fact.role].capitalize()} {item.fact.weather}{raised}{source}",
        related=None if item.source == own else item.source,
        weather_role=item.fact.role,
    )


def relation_reason(relation: RelationConstraint) -> Reason:
    """Explain a relation to a named entity."""
    reason_type, label = _RELATION_REASONS[relation.predicate]
    return Reason(
        type=reason_type, detail=f"{label} {relation.entity.name}", related=relation.entity
    )


def description_reason(words: tuple[str, ...]) -> Reason:
    """Explain an approximate match on the species description."""
    return Reason(
        type=ReasonType.DESCRIPTION_MATCH, detail=f"Description mentions {', '.join(words)}"
    )


def kind_label(kind: EntityKind) -> str:
    """Return the plural label of a kind for messages."""
    return {
        EntityKind.POKEMON: "Pokémon",
        EntityKind.MOVE: "moves",
        EntityKind.ABILITY: "abilities",
    }[kind]
