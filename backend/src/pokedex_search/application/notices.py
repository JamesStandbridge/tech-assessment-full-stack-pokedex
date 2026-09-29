"""Honest caveats and explanations, computed from the interpretation and the data."""

from collections.abc import Sequence

from pokedex_search.application.facets import Facet, FacetName
from pokedex_search.application.ports import FacetIndex
from pokedex_search.core.ranking.reasons import kind_label
from pokedex_search.domain.plan import SearchPlan
from pokedex_search.domain.results import Interpretation, Notice, NoticeCode
from pokedex_search.domain.terms import TermRole


class NoticeBuilder:
    """Builds notices and empty-outcome explanations."""

    def __init__(self, facets: FacetIndex) -> None:
        """Keep the facet index, used to detect mechanics absent from the dataset.

        Args:
            facets: Inverted index of entities.
        """
        self._facets = facets

    def notices(self, interpretation: Interpretation, approximate: bool) -> tuple[Notice, ...]:
        """Return the notices of a response."""
        notices: list[Notice] = []
        ignored = [term.text for term in interpretation.terms if term.role is TermRole.IGNORED]
        if ignored:
            notices.append(
                Notice(
                    code=NoticeCode.IGNORED_TERMS,
                    message=f"Not understood, so ignored: {', '.join(ignored)}.",
                )
            )
        if approximate:
            notices.append(
                Notice(
                    code=NoticeCode.APPROXIMATE_MATCH,
                    message="No exact match; these results are approximate.",
                )
            )
        notices.extend(self._missing_mechanics(interpretation.alternatives))
        return tuple(notices)

    def _missing_mechanics(self, plans: Sequence[SearchPlan]) -> list[Notice]:
        weathers = {plan.weather.weather for plan in plans if plan.weather is not None}
        return [
            Notice(
                code=NoticeCode.MISSING_MECHANIC,
                message=f"No move or ability in this dataset sets {weather}; "
                f"these results benefit from it once it is active.",
            )
            for weather in sorted(weathers)
            if self._facets.count(Facet(name=FacetName.WEATHER_SETTER, value=weather)) == 0
        ]

    def explanation(self, interpretation: Interpretation) -> str:
        """Explain why a valid query has no result."""
        plans = interpretation.alternatives
        if not plans:
            return "No term of the query was recognized, so there is nothing to search for."
        plan = plans[0]
        if plan.name is not None:
            return f"No Pokémon, move or ability in this dataset is named like '{plan.name}'."
        kinds = set(plan.kinds)
        for type_name in plan.types:
            typed = self._facets.having(Facet(name=FacetName.TYPE, value=type_name))
            if not any(not kinds or ref.kind in kinds for ref in typed):
                label = " or ".join(kind_label(kind) for kind in plan.kinds) or "entity"
                return f"No {label} in this dataset has the type {type_name}."
        return f"Nothing in this dataset matches: {interpretation.summary}."
