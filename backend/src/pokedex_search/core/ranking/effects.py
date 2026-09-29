"""Rank entities by how reliably they achieve an effect."""

from collections.abc import Sequence

from pokedex_search.domain.facts import SearchProfile, SourcedEffect
from pokedex_search.domain.plan import EffectConstraint


def matching_effects(
    profile: SearchProfile, constraint: EffectConstraint
) -> tuple[SourcedEffect, ...]:
    """Return the effects of a profile that answer the constraint."""
    return tuple(
        item
        for item in profile.effects
        if item.fact.effect == constraint.effect
        and item.fact.mode is constraint.mode
        and item.fact.target is constraint.target
    )


def best_effect(effects: Sequence[SourcedEffect]) -> SourcedEffect | None:
    """Return the most reliable of the matching effects, or None when there is none.

    A missing probability, as for a prevention, ranks after any known one.
    """
    if not effects:
        return None
    return max(
        effects,
        key=lambda item: -1.0 if item.fact.probability is None else item.fact.probability,
    )


def effect_key(best: SourcedEffect, effects: Sequence[SourcedEffect]) -> tuple[float, ...]:
    """Return the ascending sort key of an entity for an effect.

    The best probability ranks first, then the number of distinct sources, since
    more moves and abilities give more ways to achieve the effect.
    """
    probability = best.fact.probability
    sources = len({item.source for item in effects})
    return (1.0 if probability is None else -probability, -sources)
