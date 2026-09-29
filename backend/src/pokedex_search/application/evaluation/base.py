"""The contract every constraint evaluator fulfils."""

from typing import Protocol

from pydantic import BaseModel, ConfigDict

from pokedex_search.domain.entities import EntityKind, EntityRef
from pokedex_search.domain.plan import SearchPlan
from pokedex_search.domain.results import Reason

ALL_KINDS: frozenset[EntityKind] = frozenset(EntityKind)


class Evaluation(BaseModel):
    """Entities that satisfy one constraint, with their sort keys and reasons."""

    model_config = ConfigDict(frozen=True)

    refs: frozenset[EntityRef]
    keys: dict[EntityRef, tuple[float, ...]] = {}
    reasons: dict[EntityRef, tuple[Reason, ...]] = {}
    approximate: bool = False


class ConstraintEvaluator(Protocol):
    """Evaluates one kind of constraint of a plan."""

    def applies(self, plan: SearchPlan) -> bool:
        """Tell whether the plan holds this kind of constraint."""
        ...

    def kinds(self, plan: SearchPlan) -> frozenset[EntityKind]:
        """Return the kinds of entity the constraint can apply to."""
        ...

    def evaluate(self, plan: SearchPlan, universe: frozenset[EntityRef]) -> Evaluation:
        """Return the entities of the universe that satisfy the constraint."""
        ...


def uniform(
    refs: frozenset[EntityRef], reason: Reason | None = None, key: tuple[float, ...] = ()
) -> Evaluation:
    """Return an evaluation where every entity gets the same key and reason."""
    return Evaluation(
        refs=refs,
        keys=dict.fromkeys(refs, key) if key else {},
        reasons=dict.fromkeys(refs, (reason,)) if reason else {},
    )
