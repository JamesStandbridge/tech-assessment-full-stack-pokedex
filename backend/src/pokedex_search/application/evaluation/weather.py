"""Evaluate weather constraints: setters first, then weighted weather effects."""

from pokedex_search.application.evaluation.base import ALL_KINDS, Evaluation
from pokedex_search.application.facets import Facet, FacetName
from pokedex_search.application.ports import FacetIndex, ProfileStore
from pokedex_search.core.ranking.reasons import weather_reason
from pokedex_search.core.ranking.weather import entity_key, pokemon_key, score, weather_facts
from pokedex_search.domain.entities import EntityKind, EntityRef
from pokedex_search.domain.plan import SearchPlan, WeatherConstraint
from pokedex_search.domain.results import Reason


class WeatherEvaluator:
    """Keeps entities related to a weather, labelled by the role it plays for them."""

    def __init__(self, facets: FacetIndex, profiles: ProfileStore) -> None:
        """Keep the facet index and the profiles.

        Args:
            facets: Inverted index of entities.
            profiles: Denormalized facts of every entity.
        """
        self._facets = facets
        self._profiles = profiles

    def applies(self, plan: SearchPlan) -> bool:
        """Tell whether the plan holds a weather."""
        return plan.weather is not None

    def kinds(self, plan: SearchPlan) -> frozenset[EntityKind]:
        """Moves, abilities and the Pokémon that carry them can relate to a weather."""
        return ALL_KINDS

    def evaluate(self, plan: SearchPlan, universe: frozenset[EntityRef]) -> Evaluation:
        """Return the related entities with their weather keys and role-labelled reasons."""
        constraint = plan.weather
        if constraint is None:
            return Evaluation(refs=frozenset())
        candidates = self._facets.having(Facet(name=FacetName.WEATHER, value=constraint.weather))
        keys: dict[EntityRef, tuple[float, ...]] = {}
        reasons: dict[EntityRef, tuple[Reason, ...]] = {}
        for ref in candidates & universe:
            key = self._key(ref, constraint)
            if key is None:
                continue
            facts = weather_facts(self._profiles.profile(ref), constraint)
            keys[ref] = key
            reasons[ref] = tuple(weather_reason(item, ref) for item in facts)
        return Evaluation(refs=frozenset(keys), keys=keys, reasons=reasons)

    def _key(self, ref: EntityRef, constraint: WeatherConstraint) -> tuple[float, ...] | None:
        profile = self._profiles.profile(ref)
        if ref.kind is EntityKind.POKEMON:
            weather_score = score(profile, constraint)
            return pokemon_key(weather_score) if weather_score.qualifies else None
        facts = weather_facts(profile, constraint)
        return entity_key(facts, ref) if facts else None
