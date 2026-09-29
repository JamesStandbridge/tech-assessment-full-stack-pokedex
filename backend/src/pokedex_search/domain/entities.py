"""Pokémon, moves and abilities of the snapshot."""

from enum import StrEnum

from pydantic import BaseModel, ConfigDict


class Frozen(BaseModel):
    """Base for immutable, hashable domain values."""

    model_config = ConfigDict(frozen=True)


class EntityKind(StrEnum):
    """Kinds of entity the search returns."""

    POKEMON = "pokemon"
    MOVE = "move"
    ABILITY = "ability"


class DamageClass(StrEnum):
    """Damage class of a move."""

    PHYSICAL = "physical"
    SPECIAL = "special"
    STATUS = "status"


class EntityRef(Frozen):
    """A dataset entity identified by its kind and kebab-case name."""

    kind: EntityKind
    name: str

    def __str__(self) -> str:
        """Return the 'kind:name' form."""
        return f"{self.kind}:{self.name}"


class Stats(Frozen):
    """Base stats of a Pokémon."""

    hp: int
    attack: int
    defense: int
    special_attack: int
    special_defense: int
    speed: int


class Species(Frozen):
    """Species data of a Pokémon."""

    genus: str | None
    description: str | None
    color: str
    habitat: str | None
    is_legendary: bool
    is_mythical: bool
    evolution_chain_id: int | None


class Pokemon(Frozen):
    """A Pokémon."""

    id: int
    name: str
    types: tuple[str, ...]
    stats: Stats
    abilities: tuple[str, ...]
    moves: tuple[str, ...]
    species: Species
    height_decimetres: int
    weight_hectograms: int
    sprite_url: str | None
    artwork_url: str | None

    @property
    def ref(self) -> EntityRef:
        """Return the reference of this Pokémon."""
        return EntityRef(kind=EntityKind.POKEMON, name=self.name)


class Move(Frozen):
    """A move."""

    id: int
    name: str
    type: str
    damage_class: DamageClass
    power: int | None
    accuracy: int | None
    pp: int | None
    priority: int
    effect_chance: int | None
    short_effect: str | None
    effect: str | None
    learned_by: tuple[str, ...]

    @property
    def ref(self) -> EntityRef:
        """Return the reference of this move."""
        return EntityRef(kind=EntityKind.MOVE, name=self.name)


class Ability(Frozen):
    """An ability."""

    id: int
    name: str
    short_effect: str | None
    effect: str | None
    generation: str
    pokemon: tuple[str, ...]

    @property
    def ref(self) -> EntityRef:
        """Return the reference of this ability."""
        return EntityRef(kind=EntityKind.ABILITY, name=self.name)


Entity = Pokemon | Move | Ability


class Snapshot(Frozen):
    """Every entity of the dataset, in dataset order, with its checksum."""

    sha256: str
    pokemon: tuple[Pokemon, ...]
    moves: tuple[Move, ...]
    abilities: tuple[Ability, ...]
