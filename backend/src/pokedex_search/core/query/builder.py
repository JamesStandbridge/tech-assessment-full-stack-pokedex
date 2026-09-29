"""Turn resolved spans into one conjunctive search plan."""

from collections.abc import Callable, Sequence

from pokedex_search.core.query.concepts import Concept
from pokedex_search.core.query.draft import PlanDraft
from pokedex_search.domain.entities import DamageClass, EntityKind
from pokedex_search.domain.facts import EffectMode, EffectTarget
from pokedex_search.domain.plan import (
    Characteristic,
    CharacteristicFacet,
    Comparator,
    SearchPlan,
    SortDirection,
    StatFilter,
    StatSort,
)
from pokedex_search.domain.stats import StatName
from pokedex_search.domain.terms import TermRole

_SKIPPED = frozenset({TermRole.FILLER, TermRole.NAME, TermRole.RELATION})
FILTER_LENGTH = 2


class PlanBuilder:
    """Reads concepts in order and accumulates the constraints they express."""

    def __init__(self, concepts: Sequence[Concept]) -> None:
        """Keep the meaningful concepts of the query, in order.

        Args:
            concepts: Retained meanings of the known spans, in query order.
        """
        self._items = [concept for concept in concepts if concept.role not in _SKIPPED]
        self._mentions = [concept for concept in concepts if concept.role is TermRole.NAME]
        self._draft = PlanDraft()
        self._direction: SortDirection | None = None
        self._handlers: dict[TermRole, Callable[[int, Concept], int]] = {
            TermRole.KIND: self._kind,
            TermRole.TYPE: self._type,
            TermRole.CHARACTERISTIC: self._characteristic,
            TermRole.STAT: self._stat,
            TermRole.DIRECTION: self._direction_word,
            TermRole.COMPARATOR: self._comparator,
            TermRole.EFFECT: self._effect,
            TermRole.MODE: self._mode,
            TermRole.TARGET: self._target,
            TermRole.WEATHER: self._weather,
        }

    def build(self) -> SearchPlan:
        """Read every concept and return the plan."""
        index = 0
        while index < len(self._items):
            concept = self._items[index]
            handler = self._handlers.get(concept.role)
            index = handler(index, concept) if handler else index + 1
        if self._mentions and self._mentions[0].entity is not None:
            self._draft.mention = self._mentions[0].entity
        return self._draft.to_plan()

    def _kind(self, index: int, concept: Concept) -> int:
        self._draft.add_unique(self._draft.kinds, EntityKind(concept.value))
        return index + 1

    def _type(self, index: int, concept: Concept) -> int:
        self._draft.add_unique(self._draft.types, concept.value)
        return index + 1

    def _characteristic(self, index: int, concept: Concept) -> int:
        facet, _, value = concept.value.partition(":")
        if facet == "damage-class":
            self._draft.add_unique(self._draft.damage_classes, DamageClass(value))
        else:
            characteristic = Characteristic(facet=CharacteristicFacet(facet), value=value)
            self._draft.add_unique(self._draft.characteristics, characteristic)
        return index + 1

    def _direction_word(self, index: int, concept: Concept) -> int:
        self._direction = SortDirection(concept.value)
        return index + 1

    def _stat(self, index: int, concept: Concept) -> int:
        stat_text, _, direction_text = concept.value.partition(":")
        stat = StatName(stat_text)
        filter_end = self._filter_after(index, stat)
        if filter_end is not None:
            return filter_end
        if concept.comparative:
            self._draft.weather_stat = stat
        direction = SortDirection(direction_text) if direction_text else self._direction
        self._direction = None
        self._add_sort(stat, direction or SortDirection.DESC, concept)
        return index + 1

    def _add_sort(self, stat: StatName, direction: SortDirection, concept: Concept) -> None:
        if stat is StatName.PRIORITY:
            self._draft.add_unique(
                self._draft.filters, StatFilter(stat=stat, comparator=Comparator.GT, value=0)
            )
        sort = StatSort(stat=stat, direction=direction)
        move_sort = sort
        if concept.move_value:
            move_text, _, move_direction = concept.move_value.partition(":")
            move_sort = StatSort(stat=StatName(move_text), direction=SortDirection(move_direction))
        self._draft.sorts.append(sort)
        self._draft.move_sorts.append(move_sort)

    def _filter_after(self, index: int, stat: StatName) -> int | None:
        following = self._items[index + 1 : index + 1 + FILTER_LENGTH]
        if len(following) < FILTER_LENGTH:
            return None
        comparator, number = following
        if comparator.role is not TermRole.COMPARATOR or number.role is not TermRole.NUMBER:
            return None
        self._draft.add_unique(
            self._draft.filters,
            StatFilter(stat=stat, comparator=Comparator(comparator.value), value=int(number.value)),
        )
        return index + 3

    def _comparator(self, index: int, concept: Concept) -> int:
        items = self._items
        if index + 2 < len(items) and items[index + 1].role is TermRole.NUMBER:
            stat_concept = items[index + 2]
            if stat_concept.role is TermRole.STAT:
                stat = StatName(stat_concept.value.partition(":")[0])
                self._draft.add_unique(
                    self._draft.filters,
                    StatFilter(
                        stat=stat,
                        comparator=Comparator(concept.value),
                        value=int(items[index + 1].value),
                    ),
                )
                return index + 3
        return index + 1

    def _effect(self, index: int, concept: Concept) -> int:
        self._draft.effect = concept.value
        self._draft.default_target = concept.default_target
        return index + 1

    def _mode(self, index: int, concept: Concept) -> int:
        self._draft.mode = EffectMode(concept.value)
        return index + 1

    def _target(self, index: int, concept: Concept) -> int:
        self._draft.target = EffectTarget(concept.value)
        return index + 1

    def _weather(self, index: int, concept: Concept) -> int:
        self._draft.weather = concept.value
        return index + 1
