import pytest

from pokedex_search.domain.entities import EntityKind, Snapshot
from pokedex_search.domain.stats import StatName, stat_kind, stat_value


@pytest.mark.parametrize(
    ("name", "stat", "expected"),
    [
        ("chansey", StatName.BULK, 250 + 5 + 105),
        ("mewtwo", StatName.OFFENSE, 154),
        ("mewtwo", StatName.TOTAL, 680),
        ("electrode", StatName.SPEED, 150),
    ],
)
def test_pokemon_stats_include_derived_ones(
    snapshot: Snapshot, name: str, stat: StatName, expected: int
) -> None:
    pokemon = next(p for p in snapshot.pokemon if p.name == name)
    assert stat_value(pokemon, stat) == expected


def test_move_attributes_apply_to_moves_only(snapshot: Snapshot) -> None:
    fire_blast = next(m for m in snapshot.moves if m.name == "fire-blast")
    pikachu = next(p for p in snapshot.pokemon if p.name == "pikachu")
    assert stat_value(fire_blast, StatName.POWER) == 110
    assert stat_value(fire_blast, StatName.SPEED) is None
    assert stat_value(pikachu, StatName.POWER) is None
    assert stat_value(snapshot.abilities[0], StatName.SPEED) is None


def test_every_stat_belongs_to_one_kind() -> None:
    assert stat_kind(StatName.PRIORITY) is EntityKind.MOVE
    assert stat_kind(StatName.BULK) is EntityKind.POKEMON
