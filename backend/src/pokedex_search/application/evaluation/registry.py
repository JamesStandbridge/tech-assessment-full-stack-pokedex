"""Evaluate a whole plan: intersect every constraint, then rank per kind."""

from collections.abc import Sequence
from itertools import chain

from pydantic import BaseModel, ConfigDict

from pokedex_search.application.evaluation.base import (
    ALL_KINDS,
    ConstraintEvaluator,
    Evaluation,
)
from pokedex_search.application.ports import EntityCatalog
from pokedex_search.domain.entities import EntityKind, EntityRef
from pokedex_search.domain.plan import SearchPlan
from pokedex_search.domain.results import RankedEntity


class PlanRanking(BaseModel):
    """Every result of one plan, ranked per kind."""

    model_config = ConfigDict(frozen=True)

    by_kind: dict[EntityKind, tuple[RankedEntity, ...]]
    approximate: bool


class PlanEvaluator:
    """Runs the evaluators of the active constraints; their order sets the ranking priority."""

    def __init__(self, catalog: EntityCatalog, evaluators: Sequence[ConstraintEvaluator]) -> None:
        """Keep the catalog and the evaluators.

        Args:
            catalog: Read access to entities.
            evaluators: One evaluator per kind of constraint, in ranking priority.
        """
        self._catalog = catalog
        self._evaluators = tuple(evaluators)

    def evaluate(self, plan: SearchPlan) -> PlanRanking:
        """Return every entity that satisfies all constraints, ranked per kind.

        Args:
            plan: One conjunctive plan.

        Returns:
            The ranked results, and whether any match is approximate.
        """
        active = [evaluator for evaluator in self._evaluators if evaluator.applies(plan)]
        kinds = set(plan.kinds or ALL_KINDS)
        for evaluator in active:
            kinds &= evaluator.kinds(plan)
        universe = frozenset().union(*(self._catalog.refs(kind) for kind in kinds))
        evaluations: list[Evaluation] = []
        for evaluator in active:
            evaluation = evaluator.evaluate(plan, universe)
            universe = universe & evaluation.refs
            evaluations.append(evaluation)
        return PlanRanking(
            by_kind=self._rank(universe, evaluations),
            approximate=any(evaluation.approximate for evaluation in evaluations),
        )

    def _rank(
        self, refs: frozenset[EntityRef], evaluations: list[Evaluation]
    ) -> dict[EntityKind, tuple[RankedEntity, ...]]:
        keyed: list[tuple[tuple[float, ...], RankedEntity]] = []
        for ref in refs:
            entity = self._catalog.get(ref)
            if entity is None:
                continue
            key = tuple(chain.from_iterable(ev.keys.get(ref, ()) for ev in evaluations))
            reasons = tuple(chain.from_iterable(ev.reasons.get(ref, ()) for ev in evaluations))
            keyed.append(((*key, entity.id), RankedEntity(entity=entity, reasons=reasons)))
        keyed.sort(key=lambda item: item[0])
        by_kind: dict[EntityKind, list[RankedEntity]] = {}
        for _, ranked in keyed:
            by_kind.setdefault(ranked.entity.ref.kind, []).append(ranked)
        return {kind: tuple(items) for kind, items in by_kind.items()}
