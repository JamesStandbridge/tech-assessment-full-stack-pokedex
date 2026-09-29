"""Typed read access to the fields of the dataset snapshot that the tooling uses."""

from pathlib import Path
from typing import Never

from pydantic import BaseModel, ConfigDict, Field

from pokedex_tooling.entities import EntityKind, EntityRef
from pokedex_tooling.paths import DATASET_PATH


class _Record(BaseModel):
    model_config = ConfigDict(extra="ignore", populate_by_name=True)


class Stats(_Record):
    """Base stats of a Pokémon."""

    hp: int
    attack: int
    defense: int
    special_attack: int = Field(alias="special-attack")
    special_defense: int = Field(alias="special-defense")
    speed: int


class Species(_Record):
    """Species data of a Pokémon."""

    genus: str | None
    description: str | None
    color: str
    habitat: str | None
    is_legendary: bool
    is_mythical: bool


class PokemonRecord(_Record):
    """A Pokémon of the snapshot."""

    id: int
    name: str
    types: list[str]
    stats: Stats
    abilities: list[str]
    moves: list[str]
    species: Species


class MoveRecord(_Record):
    """A move of the snapshot."""

    id: int
    name: str
    type: str
    power: int | None
    accuracy: int | None
    pp: int | None
    priority: int
    damage_class: str
    effect_chance: int | None
    effect: str | None
    short_effect: str | None


class AbilityRecord(_Record):
    """An ability of the snapshot."""

    id: int
    name: str
    effect: str | None
    short_effect: str | None


class Snapshot(_Record):
    """The three entity collections of the snapshot."""

    pokemon: list[PokemonRecord]
    moves: list[MoveRecord]
    abilities: list[AbilityRecord]

    def records(
        self, kind: EntityKind
    ) -> list[PokemonRecord] | list[MoveRecord] | list[AbilityRecord]:
        """Return the records of one kind, in dataset order."""
        match kind:
            case EntityKind.POKEMON:
                return self.pokemon
            case EntityKind.MOVE:
                return self.moves
            case EntityKind.ABILITY:
                return self.abilities
            case _:
                unreachable: Never = kind
                raise AssertionError(unreachable)

    def find(self, ref: EntityRef) -> PokemonRecord | MoveRecord | AbilityRecord | None:
        """Return the record an entity reference points to, if it exists."""
        return next((record for record in self.records(ref.kind) if record.name == ref.name), None)


def load_snapshot(path: Path = DATASET_PATH) -> Snapshot:
    """Load the snapshot.

    Args:
        path: Location of pokedex.json.

    Returns:
        The typed snapshot.
    """
    return Snapshot.model_validate_json(path.read_text(encoding="utf-8"))
