"""Map search results to their wire shape."""

from typing import assert_never

from pokedex_search.api.schemas.common import EntityRefDTO, StatsDTO
from pokedex_search.api.schemas.search import (
    AbilityResultDTO,
    InterpretationDTO,
    MoveResultDTO,
    NoticeDTO,
    PokemonResultDTO,
    ReasonDTO,
    RefinementDTO,
    ResultDTO,
    SearchResponseDTO,
    SectionDTO,
    SuggestionDTO,
    TermDTO,
)
from pokedex_search.domain.entities import Ability, EntityRef, Move, Pokemon, Stats
from pokedex_search.domain.results import Reason, SearchResult, Section, SectionItem


def ref_dto(ref: EntityRef | None) -> EntityRefDTO | None:
    """Map an optional entity reference."""
    return EntityRefDTO(kind=ref.kind, name=ref.name) if ref else None


def stats_dto(stats: Stats) -> StatsDTO:
    """Map base stats."""
    return StatsDTO.model_validate(stats.model_dump())


def _reason(reason: Reason) -> ReasonDTO:
    return ReasonDTO(
        type=reason.type,
        detail=reason.detail,
        related=ref_dto(reason.related),
        probability=reason.probability,
        mode=reason.mode,
        target=reason.target,
        weather_role=reason.weather_role,
    )


def _pokemon(item: SectionItem, pokemon: Pokemon) -> PokemonResultDTO:
    return PokemonResultDTO(
        name=pokemon.name,
        rank=item.rank,
        reasons=[_reason(reason) for reason in item.reasons],
        id=pokemon.id,
        types=list(pokemon.types),
        stats=stats_dto(pokemon.stats),
        abilities=list(pokemon.abilities),
        genus=pokemon.species.genus,
        description=pokemon.species.description,
        sprite_url=pokemon.sprite_url,
        artwork_url=pokemon.artwork_url,
    )


def _move(item: SectionItem, move: Move) -> MoveResultDTO:
    return MoveResultDTO(
        name=move.name,
        rank=item.rank,
        reasons=[_reason(reason) for reason in item.reasons],
        id=move.id,
        type=move.type,
        damage_class=move.damage_class,
        power=move.power,
        accuracy=move.accuracy,
        pp=move.pp,
        priority=move.priority,
        effect_chance=move.effect_chance,
        short_effect=move.short_effect,
    )


def _ability(item: SectionItem, ability: Ability) -> AbilityResultDTO:
    return AbilityResultDTO(
        name=ability.name,
        rank=item.rank,
        reasons=[_reason(reason) for reason in item.reasons],
        id=ability.id,
        short_effect=ability.short_effect,
        generation=ability.generation,
    )


def _result(item: SectionItem) -> ResultDTO:
    entity = item.entity
    match entity:
        case Pokemon():
            return _pokemon(item, entity)
        case Move():
            return _move(item, entity)
        case Ability():
            return _ability(item, entity)
        case _:
            assert_never(entity)


def _section(section: Section) -> SectionDTO:
    return SectionDTO(
        kind=section.kind,
        total=section.total,
        results=[_result(item) for item in section.items],
        next_cursor=section.next_cursor,
    )


def to_search_response(result: SearchResult) -> SearchResponseDTO:
    """Map a search result to its response body."""
    interpretation = result.interpretation
    return SearchResponseDTO(
        query=result.query,
        canonical_query=result.canonical_query,
        outcome=result.outcome,
        interpretation=InterpretationDTO(
            alternatives=list(interpretation.alternatives), summary=interpretation.summary
        ),
        terms=[TermDTO.model_validate(term.model_dump()) for term in interpretation.terms],
        notices=[NoticeDTO.model_validate(notice.model_dump()) for notice in result.notices],
        explanation=result.explanation,
        suggestions=[
            SuggestionDTO.model_validate(item.model_dump()) for item in result.suggestions
        ],
        best_match=ref_dto(result.best_match),
        refinements=[
            RefinementDTO.model_validate(item.model_dump()) for item in result.refinements
        ],
        sections=[_section(section) for section in result.sections],
    )
