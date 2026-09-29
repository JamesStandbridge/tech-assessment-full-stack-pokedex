from pokedex_search.application.evaluation.facets import TypeEvaluator
from pokedex_search.application.evaluation.names import NameEvaluator
from pokedex_search.application.evaluation.registry import PlanEvaluator
from pokedex_search.application.evaluation.stats import StatEvaluator
from pokedex_search.application.facets import Facet, FacetName
from pokedex_search.domain.entities import EntityKind
from pokedex_search.domain.plan import SearchPlan, SortDirection, StatSort
from pokedex_search.domain.stats import StatName
from tests.fakes.entities import move, pokemon
from tests.fakes.index import FakeIndex

PIKACHU = pokemon("pikachu", 25, ("electric",), speed=90)
JOLTEON = pokemon("jolteon", 135, ("electric",), speed=130)
RAICHU = pokemon("raichu", 26, ("electric",), speed=130)
SQUIRTLE = pokemon("squirtle", 7, ("water",), speed=43)
THUNDER = move("thunder", 87, "electric", power=110)
ELECTRIC = frozenset({PIKACHU.ref, JOLTEON.ref, RAICHU.ref, THUNDER.ref})
INDEX = FakeIndex(
    [PIKACHU, JOLTEON, RAICHU, SQUIRTLE, THUNDER],
    facets={
        Facet(name=FacetName.TYPE, value="electric"): ELECTRIC,
        Facet(name=FacetName.TYPE, value="water"): frozenset({SQUIRTLE.ref}),
    },
)
EVALUATOR = PlanEvaluator(
    INDEX, [NameEvaluator(INDEX), TypeEvaluator(INDEX), StatEvaluator(INDEX, INDEX)]
)
FASTEST = (StatSort(stat=StatName.SPEED, direction=SortDirection.DESC),)


def _names(plan: SearchPlan, kind: EntityKind) -> list[str]:
    return [item.entity.name for item in EVALUATOR.evaluate(plan).by_kind.get(kind, ())]


def test_constraints_intersect_and_rank_with_ties_broken_by_id() -> None:
    plan = SearchPlan(types=("electric",), stat_sort=FASTEST)
    assert _names(plan, EntityKind.POKEMON) == ["raichu", "jolteon", "pikachu"]


def test_a_stat_constraint_leaves_out_kinds_without_that_stat() -> None:
    plan = SearchPlan(types=("electric",), stat_sort=FASTEST)
    assert _names(plan, EntityKind.MOVE) == []


def test_a_single_type_also_returns_moves_of_that_type() -> None:
    assert _names(SearchPlan(types=("electric",)), EntityKind.MOVE) == ["thunder"]


def test_two_types_return_pokemon_only() -> None:
    assert EVALUATOR.evaluate(SearchPlan(types=("electric", "water"))).by_kind == {}


def test_kind_words_restrict_the_universe() -> None:
    ranking = EVALUATOR.evaluate(SearchPlan(kinds=(EntityKind.MOVE,), types=("electric",)))
    assert set(ranking.by_kind) == {EntityKind.MOVE}


def test_name_matches_rank_by_tier_and_flag_typos() -> None:
    exact = EVALUATOR.evaluate(SearchPlan(name="pikachu"))
    typo = EVALUATOR.evaluate(SearchPlan(name="pikachuu"))
    assert [item.entity.name for item in exact.by_kind[EntityKind.POKEMON]] == ["pikachu"]
    assert not exact.approximate
    assert typo.approximate


def test_a_plan_without_constraint_matches_nothing() -> None:
    assert EVALUATOR.evaluate(SearchPlan()).by_kind == {}
    assert EVALUATOR.evaluate(SearchPlan(kinds=(EntityKind.POKEMON,))).by_kind == {}


def test_every_result_carries_its_reasons() -> None:
    ranking = EVALUATOR.evaluate(SearchPlan(types=("electric",), stat_sort=FASTEST))
    reasons = ranking.by_kind[EntityKind.POKEMON][0].reasons
    assert [reason.type for reason in reasons] == ["type-filter", "stat-rank"]
