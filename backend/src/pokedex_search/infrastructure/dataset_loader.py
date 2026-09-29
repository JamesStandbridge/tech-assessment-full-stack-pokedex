"""Load the snapshot from disk after verifying its checksum."""

import hashlib
from pathlib import Path

from pydantic import ValidationError

from pokedex_search.domain.entities import (
    Ability,
    DamageClass,
    Move,
    Pokemon,
    Snapshot,
    Species,
    Stats,
)
from pokedex_search.domain.errors import DatasetIntegrityError
from pokedex_search.infrastructure.snapshot_schema import (
    RawAbility,
    RawMove,
    RawPokemon,
    RawSnapshot,
)


def _clean(text: str | None) -> str | None:
    if text is None:
        return None
    return " ".join(text.replace("\u00ad", "").replace("\u2019", "'").split())


def _pokemon(raw: RawPokemon) -> Pokemon:
    species = raw.species
    return Pokemon(
        id=raw.id,
        name=raw.name,
        types=raw.types,
        stats=Stats.model_validate(raw.stats.model_dump()),
        abilities=raw.abilities,
        moves=raw.moves,
        species=Species(
            genus=species.genus,
            description=_clean(species.description),
            color=species.color,
            shape=species.shape,
            habitat=species.habitat,
            is_legendary=species.is_legendary,
            is_mythical=species.is_mythical,
            evolution_chain_id=species.evolution_chain_id,
        ),
        height_decimetres=raw.height_decimetres,
        weight_hectograms=raw.weight_hectograms,
        sprite_url=raw.images.sprite,
        artwork_url=raw.images.official_artwork,
    )


def _move(raw: RawMove) -> Move:
    return Move(
        id=raw.id,
        name=raw.name,
        type=raw.type,
        damage_class=DamageClass(raw.damage_class),
        power=raw.power,
        accuracy=raw.accuracy,
        pp=raw.pp,
        priority=raw.priority,
        effect_chance=raw.effect_chance,
        short_effect=_clean(raw.short_effect),
        effect=_clean(raw.effect),
        learned_by=raw.learned_by_pokemon,
    )


def _ability(raw: RawAbility) -> Ability:
    return Ability(
        id=raw.id,
        name=raw.name,
        short_effect=_clean(raw.short_effect),
        effect=_clean(raw.effect),
        generation=raw.generation,
        pokemon=raw.pokemon,
    )


def load_snapshot(path: Path, expected_sha256: str) -> Snapshot:
    """Read, verify and map the snapshot.

    Args:
        path: Location of pokedex.json.
        expected_sha256: Digest the file must have.

    Returns:
        The snapshot as domain entities.

    Raises:
        DatasetIntegrityError: If the file is missing, altered or malformed.
    """
    try:
        content = path.read_bytes()
    except FileNotFoundError as error:
        raise DatasetIntegrityError(f"No dataset at {path}; run prepare-data.") from error
    digest = hashlib.sha256(content).hexdigest()
    if digest != expected_sha256:
        raise DatasetIntegrityError(f"Dataset digest {digest} is not {expected_sha256}.")
    try:
        raw = RawSnapshot.model_validate_json(content)
    except ValidationError as error:
        raise DatasetIntegrityError(f"Dataset does not match its schema: {error}") from error
    return Snapshot(
        sha256=digest,
        pokemon=tuple(_pokemon(item) for item in raw.pokemon),
        moves=tuple(_move(item) for item in raw.moves),
        abilities=tuple(_ability(item) for item in raw.abilities),
    )
