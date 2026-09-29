"""Shape of the published pokedex.json file, as read from disk."""

from pydantic import BaseModel, ConfigDict, Field


class _Raw(BaseModel):
    model_config = ConfigDict(extra="ignore", frozen=True)


class RawStats(_Raw):
    """Base stats as written in the snapshot."""

    hp: int
    attack: int
    defense: int
    special_attack: int = Field(alias="special-attack")
    special_defense: int = Field(alias="special-defense")
    speed: int


class RawSpecies(_Raw):
    """Species data as written in the snapshot."""

    genus: str | None
    description: str | None
    color: str
    shape: str | None
    habitat: str | None
    is_legendary: bool
    is_mythical: bool
    evolution_chain_id: int | None


class RawImages(_Raw):
    """Image URLs as written in the snapshot."""

    sprite: str | None
    official_artwork: str | None


class RawPokemon(_Raw):
    """A Pokémon as written in the snapshot."""

    id: int
    name: str
    height_decimetres: int
    weight_hectograms: int
    types: tuple[str, ...]
    stats: RawStats
    abilities: tuple[str, ...]
    moves: tuple[str, ...]
    species: RawSpecies
    images: RawImages


class RawMove(_Raw):
    """A move as written in the snapshot."""

    id: int
    name: str
    type: str
    power: int | None
    pp: int | None
    accuracy: int | None
    priority: int
    damage_class: str
    effect_chance: int | None
    effect: str | None
    short_effect: str | None
    learned_by_pokemon: tuple[str, ...]


class RawAbility(_Raw):
    """An ability as written in the snapshot."""

    id: int
    name: str
    effect: str | None
    short_effect: str | None
    generation: str
    pokemon: tuple[str, ...]


class RawSnapshot(_Raw):
    """The whole snapshot file."""

    pokemon: tuple[RawPokemon, ...]
    moves: tuple[RawMove, ...]
    abilities: tuple[RawAbility, ...]
