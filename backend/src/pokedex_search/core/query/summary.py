"""Describe a search plan in plain words for the interface."""

from pokedex_search.domain.facts import EffectMode
from pokedex_search.domain.plan import RelationPredicate, SearchPlan, SortDirection

_KIND_LABELS = {"pokemon": "Pokémon", "move": "moves", "ability": "abilities"}
_COMPARATOR_LABELS = {"gt": "over", "gte": "at least", "lt": "under", "lte": "at most"}
_RELATION_LABELS = {
    RelationPredicate.LEARNS_MOVE: "that learn",
    RelationPredicate.HAS_ABILITY: "with the ability",
    RelationPredicate.LEARNED_BY: "learned by",
    RelationPredicate.CARRIED_BY: "carried by",
}


def _identity_parts(plan: SearchPlan) -> list[str]:
    parts: list[str] = []
    if plan.kinds:
        parts.append(" and ".join(_KIND_LABELS[kind] for kind in plan.kinds))
    if plan.name is not None:
        parts.append(f"names matching '{plan.name}'")
    if plan.dex_number is not None:
        parts.append(f"Pokédex number {plan.dex_number}")
    if plan.types:
        parts.append(f"of type {' and '.join(plan.types)}")
    parts.extend(f"{item.facet} {item.value}" for item in plan.characteristics)
    parts.extend(f"{damage_class} moves" for damage_class in plan.damage_classes)
    return parts


def _constraint_parts(plan: SearchPlan) -> list[str]:
    parts = [
        f"{item.stat} {_COMPARATOR_LABELS[item.comparator]} {item.value}"
        for item in plan.stat_filters
    ]
    if plan.effect is not None:
        verb = "that prevent" if plan.effect.mode is EffectMode.PREVENTS else "that cause"
        target = f" on the {plan.effect.target}" if plan.effect.target else ""
        parts.append(f"{verb} {plan.effect.effect}{target}")
    if plan.weather is not None:
        raised = f", raising {plan.weather.stat}" if plan.weather.stat else ""
        parts.append(f"linked to {plan.weather.weather}{raised}")
    if plan.relation is not None:
        parts.append(f"{_RELATION_LABELS[plan.relation.predicate]} {plan.relation.entity.name}")
    for item in plan.stat_sort:
        order = "highest" if item.direction is SortDirection.DESC else "lowest"
        parts.append(f"ranked by {item.stat}, {order} first")
    return parts


def describe(plan: SearchPlan) -> str:
    """Return a one-line description of what a plan searches for."""
    parts = _identity_parts(plan) + _constraint_parts(plan)
    return ", ".join(parts) if parts else "everything"
