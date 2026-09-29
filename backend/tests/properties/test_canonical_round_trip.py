from hypothesis import assume, given, settings
from hypothesis import strategies as st

from pokedex_search.core.query.canonical import CanonicalWriter
from pokedex_search.core.query.parser import VocabularyQueryParser
from pokedex_search.domain.entities import DamageClass, EntityKind, EntityRef
from pokedex_search.domain.facts import EffectMode, EffectTarget
from pokedex_search.domain.plan import (
    Characteristic,
    CharacteristicFacet,
    Comparator,
    EffectConstraint,
    RelationConstraint,
    RelationPredicate,
    SearchPlan,
    SortDirection,
    StatFilter,
    StatSort,
    WeatherConstraint,
)
from pokedex_search.domain.query import ValidQuery
from pokedex_search.domain.stats import StatName

BASE_STATS = [
    StatName.HP,
    StatName.ATTACK,
    StatName.DEFENSE,
    StatName.SPECIAL_ATTACK,
    StatName.SPECIAL_DEFENSE,
    StatName.SPEED,
    StatName.TOTAL,
    StatName.BULK,
    StatName.OFFENSE,
]
TYPES = ["fire", "water", "electric", "grass", "psychic", "poison", "dragon", "ice"]
CHARACTERISTICS = [
    Characteristic(facet=CharacteristicFacet.COLOR, value="blue"),
    Characteristic(facet=CharacteristicFacet.HABITAT, value="cave"),
    Characteristic(facet=CharacteristicFacet.HABITAT, value="waters-edge"),
    Characteristic(facet=CharacteristicFacet.LEGENDARY, value="true"),
    Characteristic(facet=CharacteristicFacet.MYTHICAL, value="true"),
]
EFFECTS = [
    "sleep",
    "paralysis",
    "poison",
    "burn",
    "confusion",
    "flinch",
    "healing",
    "forced-switch",
    "ground",
    "electric",
]
AMBIGUOUS_WORDS = frozenset({"psychic", "confusion"})
RELATIONS = [
    RelationConstraint(
        predicate=RelationPredicate.LEARNS_MOVE,
        entity=EntityRef(kind=EntityKind.MOVE, name="thunder-wave"),
    ),
    RelationConstraint(
        predicate=RelationPredicate.HAS_ABILITY,
        entity=EntityRef(kind=EntityKind.ABILITY, name="levitate"),
    ),
    RelationConstraint(
        predicate=RelationPredicate.LEARNED_BY,
        entity=EntityRef(kind=EntityKind.POKEMON, name="pikachu"),
    ),
]

effects = st.builds(
    EffectConstraint,
    effect=st.sampled_from(EFFECTS),
    mode=st.just(EffectMode.CAUSES),
    target=st.sampled_from([EffectTarget.OPPONENT, EffectTarget.USER]),
) | st.builds(
    EffectConstraint,
    effect=st.sampled_from(EFFECTS),
    mode=st.just(EffectMode.PREVENTS),
    target=st.none(),
)
plans = st.builds(
    SearchPlan,
    kinds=st.lists(st.sampled_from(list(EntityKind)), unique=True, max_size=2).map(tuple),
    types=st.lists(st.sampled_from(TYPES), unique=True, max_size=2).map(tuple),
    characteristics=st.lists(st.sampled_from(CHARACTERISTICS), unique=True, max_size=2).map(tuple),
    stat_sort=st.lists(
        st.builds(
            StatSort, stat=st.sampled_from(BASE_STATS), direction=st.sampled_from(SortDirection)
        ),
        unique_by=lambda sort: sort.stat,
        max_size=2,
    ).map(tuple),
    stat_filters=st.lists(
        st.builds(
            StatFilter,
            stat=st.sampled_from(BASE_STATS),
            comparator=st.sampled_from(Comparator),
            value=st.integers(min_value=0, max_value=300),
        ),
        max_size=1,
    ).map(tuple),
    damage_classes=st.lists(st.sampled_from(DamageClass), unique=True, max_size=1).map(tuple),
    effect=st.none() | effects,
    weather=st.none()
    | st.builds(
        WeatherConstraint,
        weather=st.sampled_from(["rain", "sun", "sandstorm", "hail"]),
        stat=st.sampled_from([None, StatName.SPEED]),
    ),
    relation=st.none() | st.sampled_from(RELATIONS),
)


def _parser_can_produce(plan: SearchPlan) -> bool:
    learned_by_ability = (
        plan.relation is not None
        and plan.relation.predicate is RelationPredicate.LEARNED_BY
        and plan.kinds == (EntityKind.ABILITY,)
    )
    weather_stat_sorted = (
        plan.weather is not None
        and plan.weather.stat is not None
        and any(sort.stat is plan.weather.stat for sort in plan.stat_sort)
    )
    effect_named_like_type = plan.effect is not None and plan.effect.effect in plan.types
    return not (
        plan.is_empty or learned_by_ability or weather_stat_sorted or effect_named_like_type
    )


@settings(max_examples=300, deadline=None)
@given(plan=plans)
def test_a_canonical_query_parses_back_to_its_plan(
    parser: VocabularyQueryParser, writer: CanonicalWriter, plan: SearchPlan
) -> None:
    assume(_parser_can_produce(plan))
    alternatives = parser.parse(ValidQuery(text=writer.serialize(plan))).alternatives
    constraint = writer.serialize(plan.model_copy(update={"kinds": ()}))
    assume(len(alternatives) == 1 or constraint not in AMBIGUOUS_WORDS)
    assert alternatives == (plan,)
