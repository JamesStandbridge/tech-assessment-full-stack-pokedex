"""Stats that queries can filter and rank by."""

from enum import StrEnum
from typing import assert_never

from pokedex_search.domain.entities import Ability, Entity, EntityKind, Move, Pokemon


class StatName(StrEnum):
    """Base and derived Pokémon stats, and move attributes."""

    HP = "hp"
    ATTACK = "attack"
    DEFENSE = "defense"
    SPECIAL_ATTACK = "special-attack"
    SPECIAL_DEFENSE = "special-defense"
    SPEED = "speed"
    TOTAL = "total"
    BULK = "bulk"
    OFFENSE = "offense"
    POWER = "power"
    ACCURACY = "accuracy"
    PP = "pp"
    PRIORITY = "priority"


MOVE_STATS: frozenset[StatName] = frozenset(
    {StatName.POWER, StatName.ACCURACY, StatName.PP, StatName.PRIORITY}
)


def stat_kind(stat: StatName) -> EntityKind:
    """Return the kind of entity a stat belongs to."""
    return EntityKind.MOVE if stat in MOVE_STATS else EntityKind.POKEMON


def pokemon_stat(pokemon: Pokemon, stat: StatName) -> int | None:
    """Return a base or derived stat of a Pokémon, or None for a move attribute."""
    stats = pokemon.stats
    base = {
        StatName.HP: stats.hp,
        StatName.ATTACK: stats.attack,
        StatName.DEFENSE: stats.defense,
        StatName.SPECIAL_ATTACK: stats.special_attack,
        StatName.SPECIAL_DEFENSE: stats.special_defense,
        StatName.SPEED: stats.speed,
    }
    if stat in base:
        return base[stat]
    if stat is StatName.TOTAL:
        return sum(base.values())
    if stat is StatName.BULK:
        return stats.hp + stats.defense + stats.special_defense
    if stat is StatName.OFFENSE:
        return max(stats.attack, stats.special_attack)
    return None


def move_stat(move: Move, stat: StatName) -> int | None:
    """Return a move attribute, or None when the move has no value or the stat is not a move's."""
    attributes = {
        StatName.POWER: move.power,
        StatName.ACCURACY: move.accuracy,
        StatName.PP: move.pp,
        StatName.PRIORITY: move.priority,
    }
    return attributes.get(stat)


def stat_value(entity: Entity, stat: StatName) -> int | None:
    """Return the value of a stat for any entity, or None when it does not apply."""
    match entity:
        case Pokemon():
            return pokemon_stat(entity, stat)
        case Move():
            return move_stat(entity, stat)
        case Ability():
            return None
        case _:
            assert_never(entity)
