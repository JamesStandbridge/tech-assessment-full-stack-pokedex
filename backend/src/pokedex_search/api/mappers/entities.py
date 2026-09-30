"""Map entity details and typing suggestions to their wire shape."""

from typing import assert_never

from pokedex_search.api.mappers.search import ref_dto, stats_dto
from pokedex_search.api.schemas.entities import (
    AbilityDetailDTO,
    ConceptDTO,
    EntityDetailDTO,
    MoveDetailDTO,
    PokemonDetailDTO,
    SpeciesDTO,
    SpeciesResponseDTO,
    SuggestItemDTO,
    SuggestResponseDTO,
)
from pokedex_search.domain.details import EntityDetail
from pokedex_search.domain.entities import Ability, Move, Pokemon
from pokedex_search.domain.suggestions import TypingSuggestion


def _pokemon(pokemon: Pokemon, family: tuple[str, ...]) -> PokemonDetailDTO:
    species = pokemon.species
    return PokemonDetailDTO(
        id=pokemon.id,
        name=pokemon.name,
        types=list(pokemon.types),
        stats=stats_dto(pokemon.stats),
        abilities=list(pokemon.abilities),
        moves=list(pokemon.moves),
        genus=species.genus,
        description=species.description,
        height_decimetres=pokemon.height_decimetres,
        weight_hectograms=pokemon.weight_hectograms,
        color=species.color,
        shape=species.shape,
        habitat=species.habitat,
        is_legendary=species.is_legendary,
        is_mythical=species.is_mythical,
        evolution_family=list(family),
        sprite_url=pokemon.sprite_url,
        artwork_url=pokemon.artwork_url,
    )


def _move(move: Move) -> MoveDetailDTO:
    return MoveDetailDTO(
        id=move.id,
        name=move.name,
        type=move.type,
        damage_class=move.damage_class,
        power=move.power,
        accuracy=move.accuracy,
        pp=move.pp,
        priority=move.priority,
        effect_chance=move.effect_chance,
        short_effect=move.short_effect,
        effect=move.effect,
        learned_by=list(move.learned_by),
    )


def to_entity_detail(detail: EntityDetail) -> EntityDetailDTO:
    """Map an entity detail to its response body."""
    entity = detail.entity
    match entity:
        case Pokemon():
            return _pokemon(entity, detail.evolution_family)
        case Move():
            return _move(entity)
        case Ability():
            return AbilityDetailDTO(
                id=entity.id,
                name=entity.name,
                short_effect=entity.short_effect,
                effect=entity.effect,
                generation=entity.generation,
                pokemon=list(entity.pokemon),
            )
        case _:
            assert_never(entity)


def to_species_response(species: tuple[Pokemon, ...]) -> SpeciesResponseDTO:
    """Map every Pokémon to the species list body."""
    return SpeciesResponseDTO(
        species=[
            SpeciesDTO(
                id=pokemon.id,
                name=pokemon.name,
                types=list(pokemon.types),
                stats=stats_dto(pokemon.stats),
                genus=pokemon.species.genus,
                is_legendary=pokemon.species.is_legendary,
                is_mythical=pokemon.species.is_mythical,
                sprite_url=pokemon.sprite_url,
            )
            for pokemon in species
        ]
    )


def to_suggest_response(suggestions: tuple[TypingSuggestion, ...]) -> SuggestResponseDTO:
    """Map typing suggestions to their response body."""
    return SuggestResponseDTO(
        suggestions=[
            SuggestItemDTO(
                kind=item.kind,
                label=item.label,
                query=item.query,
                entity=ref_dto(item.entity),
                concept=ConceptDTO(role=item.concept_role, value=item.concept_value)
                if item.concept_role and item.concept_value
                else None,
            )
            for item in suggestions
        ]
    )
