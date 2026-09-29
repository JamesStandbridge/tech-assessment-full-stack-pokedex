import pytest

from pokedex_search.core.query.parser import VocabularyQueryParser
from pokedex_search.domain.query import ValidQuery
from pokedex_search.domain.terms import TermRole

PLANS: list[tuple[str, dict[str, object]]] = [
    ("bulba", {"name": "bulba"}),
    ("Mr. Mime", {"name": "mrmime"}),
    ("#25", {"dex_number": 25}),
    (
        "fast electric flying pokemon",
        {
            "kinds": ["pokemon"],
            "types": ["electric", "flying"],
            "stat_sort": [{"stat": "speed", "direction": "desc"}],
        },
    ),
    (
        "highest sp atk psychic pokemon",
        {
            "kinds": ["pokemon"],
            "types": ["psychic"],
            "stat_sort": [{"stat": "special-attack", "direction": "desc"}],
        },
    ),
    (
        "electric pokemon with speed over 100",
        {
            "kinds": ["pokemon"],
            "types": ["electric"],
            "stat_filters": [{"stat": "speed", "comparator": "gt", "value": 100}],
        },
    ),
    (
        "strongest fire move",
        {
            "kinds": ["move"],
            "types": ["fire"],
            "stat_sort": [{"stat": "power", "direction": "desc"}],
        },
    ),
    (
        "prevent sleep",
        {"effect": {"effect": "sleep", "mode": "prevents", "target": None}},
    ),
    (
        "Which Pokémon can put the opponent to sleep?",
        {
            "kinds": ["pokemon"],
            "effect": {"effect": "sleep", "mode": "causes", "target": "opponent"},
        },
    ),
    ("faster in the rain", {"weather": {"weather": "rain", "stat": "speed"}}),
    (
        "pokemon with levitate",
        {
            "kinds": ["pokemon"],
            "relation": {
                "predicate": "has-ability",
                "entity": {"kind": "ability", "name": "levitate"},
            },
        },
    ),
    (
        "moves learned by pikachu",
        {
            "kinds": ["move"],
            "relation": {
                "predicate": "learned-by",
                "entity": {"kind": "pokemon", "name": "pikachu"},
            },
        },
    ),
    ("dragon pokemon", {"kinds": ["pokemon"], "types": ["dragon"]}),
    ("poison pokemon", {"kinds": ["pokemon"], "types": ["poison"]}),
    (
        "poison the opponent",
        {"effect": {"effect": "poison", "mode": "causes", "target": "opponent"}},
    ),
    (
        "moves that restore hp",
        {"kinds": ["move"], "effect": {"effect": "healing", "mode": "causes", "target": "user"}},
    ),
    (
        "force the opponent to switch",
        {"effect": {"effect": "forced-switch", "mode": "causes", "target": "opponent"}},
    ),
    ("the opponent", {}),
    (
        "moves that raise attack",
        {
            "kinds": ["move"],
            "effect": {"effect": "raise-attack", "mode": "causes", "target": "user"},
        },
    ),
    (
        "lower speed of the opponent",
        {"effect": {"effect": "lower-speed", "mode": "causes", "target": "opponent"}},
    ),
    (
        "boost special attack",
        {"effect": {"effect": "raise-special-attack", "mode": "causes", "target": "user"}},
    ),
    (
        "pokemon immune to ground moves",
        {"kinds": ["pokemon"], "effect": {"effect": "ground", "mode": "prevents", "target": None}},
    ),
    (
        "strongest ground moves",
        {
            "kinds": ["move"],
            "types": ["ground"],
            "stat_sort": [{"stat": "power", "direction": "desc"}],
        },
    ),
    (
        "fire pokemon immune to sleep",
        {
            "kinds": ["pokemon"],
            "types": ["fire"],
            "effect": {"effect": "sleep", "mode": "prevents", "target": None},
        },
    ),
    (
        "moves that go first",
        {
            "kinds": ["move"],
            "stat_sort": [{"stat": "priority", "direction": "desc"}],
            "stat_filters": [{"stat": "priority", "comparator": "gt", "value": 0}],
        },
    ),
]


@pytest.mark.parametrize(("query", "expected"), PLANS, ids=[query for query, _ in PLANS])
def test_queries_read_as_one_conjunctive_plan(
    parser: VocabularyQueryParser, query: str, expected: dict[str, object]
) -> None:
    interpretation = parser.parse(ValidQuery(text=query))
    assert len(interpretation.alternatives) == 1
    assert interpretation.alternatives[0].model_dump(mode="json", exclude_defaults=True) == expected


def test_a_word_that_is_both_a_type_and_a_move_has_two_readings(
    parser: VocabularyQueryParser,
) -> None:
    alternatives = parser.parse(ValidQuery(text="psychic")).alternatives
    assert [plan.model_dump(exclude_defaults=True) for plan in alternatives] == [
        {"types": ("psychic",)},
        {"name": "psychic"},
    ]


def test_unknown_words_beside_a_constraint_are_ignored(parser: VocabularyQueryParser) -> None:
    terms = parser.parse(ValidQuery(text="rain team against brock")).terms
    assert [(term.text, term.role) for term in terms] == [
        ("rain", TermRole.WEATHER),
        ("team", TermRole.FILLER),
        ("against", TermRole.IGNORED),
        ("brock", TermRole.IGNORED),
    ]


def test_a_phrase_of_several_words_is_one_term(parser: VocabularyQueryParser) -> None:
    terms = parser.parse(ValidQuery(text="pokemon that learn thunder wave")).terms
    assert terms[-1].text == "thunder wave"
    assert terms[-1].role is TermRole.NAME


def test_a_query_of_fillers_only_has_no_plan(parser: VocabularyQueryParser) -> None:
    assert parser.parse(ValidQuery(text="the one")).alternatives == ()
