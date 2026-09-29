from pokedex_search.core.query.concepts import Concept, Span
from pokedex_search.core.query.conflicts import resolve
from pokedex_search.domain.entities import EntityKind, EntityRef
from pokedex_search.domain.terms import TermRole

POISON = Span(
    start=0,
    end=1,
    concepts=(
        Concept(role=TermRole.TYPE, value="poison"),
        Concept(role=TermRole.EFFECT, value="poison"),
    ),
)
OPPONENT = Span(start=1, end=2, concepts=(Concept(role=TermRole.TARGET, value="opponent"),))
LEARN = Span(start=0, end=1, concepts=(Concept(role=TermRole.RELATION, value="learns"),))
SURF = Span(
    start=1,
    end=2,
    concepts=(
        Concept(
            role=TermRole.NAME, value="surf", entity=EntityRef(kind=EntityKind.MOVE, name="surf")
        ),
    ),
)


def _roles(spans: list[Span]) -> list[TermRole | None]:
    return [span.concept.role if span.concept else None for span in resolve(spans)]


def test_a_type_that_is_also_an_effect_is_the_type_by_default() -> None:
    assert _roles([POISON]) == [TermRole.TYPE]


def test_a_target_word_makes_it_the_effect() -> None:
    assert _roles([POISON, OPPONENT]) == [TermRole.EFFECT, TermRole.TARGET]


def test_it_stays_the_type_when_another_effect_is_named() -> None:
    sleep = Span(start=2, end=3, concepts=(Concept(role=TermRole.EFFECT, value="sleep"),))
    assert _roles([POISON, OPPONENT, sleep]) == [TermRole.TYPE, TermRole.TARGET, TermRole.EFFECT]


def test_a_relation_word_needs_an_entity_mention() -> None:
    assert _roles([LEARN]) == [TermRole.FILLER]
    assert _roles([LEARN, SURF]) == [TermRole.RELATION, TermRole.NAME]


def test_unknown_spans_stay_unknown() -> None:
    assert _roles([Span(start=0, end=1, concepts=())]) == [None]
