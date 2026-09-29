"""Rank entities by how reliably they achieve an effect."""

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


def best_effect(profile: SearchProfile, constraint: EffectConstraint) -> SourcedEffect | None:
    """Return the most reliable source of the effect, or None when there is none.

    A missing probability, as for a prevention, ranks after any known one.
    """
    effects = matching_effects(profile, constraint)
    if not effects:
        return None
    return max(
        effects,
        key=lambda item: -1.0 if item.fact.probability is None else item.fact.probability,
    )


def effect_key(effect: SourcedEffect) -> tuple[float, ...]:
    """Return the ascending sort key of an entity's best source of an effect."""
    probability = effect.fact.probability
    return (1.0 if probability is None else -probability,)
