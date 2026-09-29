"""Derive ready-to-run adjustments of a plan's constraints."""

from collections.abc import Callable, Iterable

from pokedex_search.domain.facts import EffectMode, EffectTarget
from pokedex_search.domain.plan import (
    EffectConstraint,
    SearchPlan,
    SortDirection,
    StatSort,
)
from pokedex_search.domain.results import Refinement, RefinementAction
from pokedex_search.domain.stats import StatName

Writer = Callable[[SearchPlan], str]


def _without[ItemT](items: tuple[ItemT, ...], item: ItemT) -> tuple[ItemT, ...]:
    return tuple(other for other in items if other != item)


def _removals(plan: SearchPlan) -> Iterable[tuple[str, str, SearchPlan]]:
    for kind in plan.kinds:
        yield (
            f"kind:{kind}",
            f"Any kind instead of {kind}",
            plan.model_copy(update={"kinds": _without(plan.kinds, kind)}),
        )
    for type_name in plan.types:
        yield (
            f"type:{type_name}",
            f"Without type {type_name}",
            plan.model_copy(update={"types": _without(plan.types, type_name)}),
        )
    for item in plan.characteristics:
        yield (
            f"{item.facet}:{item.value}",
            f"Without {item.facet} {item.value}",
            plan.model_copy(update={"characteristics": _without(plan.characteristics, item)}),
        )
    for rule in plan.stat_filters:
        yield (
            f"filter:{rule.stat}",
            f"Without the {rule.stat} limit",
            plan.model_copy(update={"stat_filters": _without(plan.stat_filters, rule)}),
        )
    optional = {"effect": plan.effect, "weather": plan.weather, "relation": plan.relation}
    for field, value in optional.items():
        if value is not None:
            yield field, f"Without the {field}", plan.model_copy(update={field: None})


def _replacements(plan: SearchPlan) -> Iterable[tuple[str, str, SearchPlan]]:
    for sort in plan.stat_sort:
        flipped = SortDirection.ASC if sort.direction is SortDirection.DESC else SortDirection.DESC
        replaced = tuple(
            StatSort(stat=sort.stat, direction=flipped) if other == sort else other
            for other in plan.stat_sort
        )
        label = f"{'Lowest' if flipped is SortDirection.ASC else 'Highest'} {sort.stat} first"
        yield f"sort:{sort.stat}", label, plan.model_copy(update={"stat_sort": replaced})
    effect = plan.effect
    if effect is not None:
        causes = effect.mode is EffectMode.PREVENTS
        toggled = EffectConstraint(
            effect=effect.effect,
            mode=EffectMode.CAUSES if causes else EffectMode.PREVENTS,
            target=EffectTarget.OPPONENT if causes else None,
        )
        label = f"{'Cause' if causes else 'Prevent'} {effect.effect} instead"
        yield "effect", label, plan.model_copy(update={"effect": toggled})


def _additions(plan: SearchPlan) -> Iterable[tuple[str, str, SearchPlan]]:
    if plan.types and not plan.stat_sort and plan.name is None:
        sort = StatSort(stat=StatName.SPEED, direction=SortDirection.DESC)
        yield "sort:speed", "Fastest first", plan.model_copy(update={"stat_sort": (sort,)})


def derive_refinements(plan: SearchPlan, write: Writer) -> tuple[Refinement, ...]:
    """Return removals, replacements and additions of the plan's constraints.

    Args:
        plan: The plan to adjust.
        write: Writer of canonical queries.

    Returns:
        One refinement per adjustment, each with its canonical query.
    """
    groups = (
        (RefinementAction.REMOVE, _removals(plan)),
        (RefinementAction.REPLACE, _replacements(plan)),
        (RefinementAction.ADD, _additions(plan)),
    )
    return tuple(
        Refinement(constraint=constraint, action=action, label=label, query=write(adjusted))
        for action, items in groups
        for constraint, label, adjusted in items
        if not adjusted.is_empty or adjusted.kinds
    )
