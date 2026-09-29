from pokedex_search.application.evaluation.registry import PlanRanking
from pokedex_search.application.facets import Facet, FacetName
from pokedex_search.application.notices import NoticeBuilder
from pokedex_search.application.ranking_cache import RankingCache
from pokedex_search.application.suggestions import BestMatchFinder
from pokedex_search.domain.entities import EntityKind
from pokedex_search.domain.plan import SearchPlan, WeatherConstraint
from pokedex_search.domain.results import Interpretation, NoticeCode
from pokedex_search.domain.terms import Term, TermRole
from tests.fakes.entities import ability, move, pokemon
from tests.fakes.index import FakeIndex

INDEX = FakeIndex(
    [
        pokemon("mew", 151),
        pokemon("mewtwo", 150),
        pokemon("nidoran-f", 29),
        pokemon("nidoran-m", 32),
        move("thunder", 87),
        move("thunderbolt", 85),
        ability("drought", 70),
    ],
    facets={Facet(name=FacetName.WEATHER_SETTER, value="sun"): frozenset()},
)


def _interpretation(plan: SearchPlan, *terms: Term) -> Interpretation:
    return Interpretation(terms=terms, alternatives=(plan,), summary="summary")


def test_best_match_is_the_single_exact_name_then_the_single_prefix() -> None:
    finder = BestMatchFinder(INDEX)
    assert str(finder.best_match([SearchPlan(name="mew")])) == "pokemon:mew"
    assert str(finder.best_match([SearchPlan(name="thunder")])) == "move:thunder"
    assert finder.best_match([SearchPlan(name="nidoran")]) is None
    assert finder.best_match([SearchPlan(types=("fire",))]) is None


def test_ignored_terms_and_approximate_matches_are_noticed() -> None:
    ignored = Term(text="brock", role=TermRole.IGNORED, value=None)
    notices = NoticeBuilder(INDEX).notices(_interpretation(SearchPlan(), ignored), approximate=True)
    assert [notice.code for notice in notices] == [
        NoticeCode.IGNORED_TERMS,
        NoticeCode.APPROXIMATE_MATCH,
    ]
    assert "brock" in notices[0].message


def test_a_weather_without_setter_in_the_data_is_noticed() -> None:
    plan = SearchPlan(weather=WeatherConstraint(weather="rain", stat=None))
    notices = NoticeBuilder(INDEX).notices(_interpretation(plan), approximate=False)
    assert [notice.code for notice in notices] == [NoticeCode.MISSING_MECHANIC]


def test_an_empty_outcome_names_the_type_no_pokemon_has() -> None:
    plan = SearchPlan(kinds=(EntityKind.POKEMON,), types=("dark",))
    explanation = NoticeBuilder(INDEX).explanation(_interpretation(plan))
    assert explanation == "No Pokémon in this dataset has the type dark."


def test_the_ranking_cache_evicts_the_least_recently_used() -> None:
    cache = RankingCache(capacity=2)
    ranking = (PlanRanking(by_kind={}, approximate=False),)
    cache.put("a", ranking)
    cache.put("b", ranking)
    assert cache.get("a") == ranking
    cache.put("c", ranking)
    assert (cache.get("a"), cache.get("b"), cache.get("c")) == (ranking, None, ranking)
