from pokedex_search.core.query.canonical import CanonicalWriter
from pokedex_search.domain.entities import EntityKind
from pokedex_search.domain.facts import EffectMode, EffectTarget
from pokedex_search.domain.plan import EffectConstraint, SearchPlan, SortDirection, StatSort
from pokedex_search.domain.results import RefinementAction
from pokedex_search.domain.stats import StatName

FAST_ELECTRIC = SearchPlan(
    kinds=(EntityKind.POKEMON,),
    types=("electric",),
    stat_sort=(StatSort(stat=StatName.SPEED, direction=SortDirection.DESC),),
)


def test_plans_are_written_with_canonical_words(writer: CanonicalWriter) -> None:
    assert writer.serialize(FAST_ELECTRIC) == "highest speed electric pokemon"
    poison = SearchPlan(
        effect=EffectConstraint(
            effect="poison", mode=EffectMode.CAUSES, target=EffectTarget.OPPONENT
        )
    )
    assert writer.serialize(poison) == "poison opponent"


def test_refinements_remove_replace_and_add_constraints(writer: CanonicalWriter) -> None:
    refinements = {
        (item.constraint, item.action): item.query for item in writer.refinements(FAST_ELECTRIC)
    }
    assert refinements[("type:electric", RefinementAction.REMOVE)] == "highest speed pokemon"
    assert refinements[("sort:speed", RefinementAction.REPLACE)] == "lowest speed electric pokemon"
    assert refinements[("kind:pokemon", RefinementAction.REMOVE)] == "highest speed electric"


def test_a_types_only_plan_can_add_a_speed_ranking(writer: CanonicalWriter) -> None:
    refinements = writer.refinements(SearchPlan(types=("fire",)))
    assert [(item.action, item.query) for item in refinements] == [
        (RefinementAction.ADD, "highest speed fire")
    ]
