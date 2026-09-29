"""Order result kinds into sections and slice them into pages."""

from collections.abc import Mapping, Sequence

from pokedex_search.application.pagination import Cursor, CursorCodec
from pokedex_search.domain.entities import EntityKind
from pokedex_search.domain.plan import SearchPlan
from pokedex_search.domain.results import RankedEntity, Section, SectionItem

_EFFECT_ORDER = (EntityKind.MOVE, EntityKind.ABILITY, EntityKind.POKEMON)
_WEATHER_ORDER = (EntityKind.ABILITY, EntityKind.MOVE, EntityKind.POKEMON)
_DEFAULT_ORDER = (EntityKind.POKEMON, EntityKind.MOVE, EntityKind.ABILITY)


def kind_order(plan: SearchPlan) -> tuple[EntityKind, ...]:
    """Return the order of sections that suits the plan's main constraint."""
    if plan.kinds:
        return plan.kinds + tuple(kind for kind in _DEFAULT_ORDER if kind not in plan.kinds)
    if plan.weather is not None:
        return _WEATHER_ORDER
    if plan.effect is not None:
        return _EFFECT_ORDER
    return _DEFAULT_ORDER


class SectionBuilder:
    """Builds one page per section, with a cursor to the next page."""

    def __init__(self, codec: CursorCodec) -> None:
        """Keep the cursor codec.

        Args:
            codec: Encoder of cursor tokens.
        """
        self._codec = codec

    def build(
        self,
        ranked: Mapping[EntityKind, Sequence[RankedEntity]],
        order: Sequence[EntityKind],
        page: Cursor | None,
        limit: int,
        fingerprint: str,
    ) -> tuple[Section, ...]:
        """Slice every non-empty kind, or only the kind of the cursor.

        Args:
            ranked: Complete rankings per kind.
            order: Order of the sections.
            page: Cursor of the requested page, if any.
            limit: Maximum results per section.
            fingerprint: Identity of the ranking, stored in cursors.

        Returns:
            The sections of the page.
        """
        kinds = [page.kind] if page else [kind for kind in order if ranked.get(kind)]
        offset = page.offset if page else 0
        return tuple(
            self._section(kind, ranked.get(kind, ()), offset, limit, fingerprint)
            for kind in kinds
            if ranked.get(kind)
        )

    def _section(
        self,
        kind: EntityKind,
        items: Sequence[RankedEntity],
        offset: int,
        limit: int,
        fingerprint: str,
    ) -> Section:
        end = offset + limit
        page_items = tuple(
            SectionItem(rank=rank, entity=item.entity, reasons=item.reasons)
            for rank, item in enumerate(items[offset:end], start=offset + 1)
        )
        next_cursor = (
            self._codec.encode(Cursor(kind=kind, offset=end, fingerprint=fingerprint))
            if end < len(items)
            else None
        )
        return Section(kind=kind, total=len(items), items=page_items, next_cursor=next_cursor)
