import pytest

from pokedex_search.core.enrichment.effect_classifier import EffectClassifier
from pokedex_search.core.enrichment.lexicon import Lexicon
from pokedex_search.core.enrichment.weather_classifier import WeatherClassifier
from pokedex_search.domain.entities import Ability, Move, Snapshot
from pokedex_search.infrastructure.resources import load_resource


@pytest.fixture(scope="module")
def lexicon() -> Lexicon:
    return load_resource("lexicon.yaml", Lexicon)


def _entity(snapshot: Snapshot, name: str) -> Move | Ability:
    entities: tuple[Move | Ability, ...] = (*snapshot.moves, *snapshot.abilities)
    return next(entity for entity in entities if entity.name == name)


EFFECTS = [
    ("spore", [("sleep", "causes", "opponent", 1.0)]),
    ("sing", [("sleep", "causes", "opponent", 0.55)]),
    ("rest", [("sleep", "causes", "user", 1.0), ("healing", "causes", "user", 1.0)]),
    (
        "dream-eater",
        [("sleep", "requires", "opponent", None), ("healing", "causes", "user", 1.0)],
    ),
    ("recover", [("healing", "causes", "user", 1.0)]),
    ("leech-seed", [("healing", "causes", "user", 0.9)]),
    ("rain-dish", [("healing", "causes", "user", None)]),
    ("regenerator", [("healing", "causes", "user", None)]),
    ("liquid-ooze", []),
    ("roar", [("forced-switch", "causes", "opponent", 1.0)]),
    ("natural-cure", []),
    ("levitate", [("ground", "prevents", None, None)]),
    (
        "volt-absorb",
        [("healing", "causes", "user", None), ("electric", "prevents", None, None)],
    ),
    ("flash-fire", [("fire", "prevents", None, None)]),
    ("thick-fat", []),
    ("swords-dance", [("raise-attack", "causes", "user", 1.0)]),
    (
        "growth",
        [("raise-attack", "causes", "user", 1.0), ("raise-special-attack", "causes", "user", 1.0)],
    ),
    ("rage", [("raise-attack", "causes", "user", 1.0)]),
    ("amnesia", [("raise-special-defense", "causes", "user", 1.0)]),
    (
        "weak-armor",
        [("raise-speed", "causes", "user", None), ("lower-defense", "causes", "user", None)],
    ),
    ("intimidate", [("lower-attack", "causes", "opponent", None)]),
    ("aurora-beam", [("lower-attack", "causes", "opponent", 0.1)]),
    ("growl", [("lower-attack", "causes", "opponent", 1.0)]),
    ("wonder-skin", []),
    ("blaze", []),
    ("arena-trap", []),
    ("insomnia", [("sleep", "prevents", None, None)]),
    ("thrash", [("confusion", "causes", "user", 1.0)]),
    ("toxic", [("poison", "causes", "opponent", 0.9)]),
    ("thunder", [("paralysis", "causes", "opponent", 0.21)]),
    ("static", [("paralysis", "causes", "opponent", 0.3)]),
    (
        "tri-attack",
        [
            ("paralysis", "causes", "opponent", 0.0667),
            ("burn", "causes", "opponent", 0.0667),
            ("freeze", "causes", "opponent", 0.0667),
        ],
    ),
    (
        "effect-spore",
        [
            ("sleep", "causes", "opponent", 0.1),
            ("paralysis", "causes", "opponent", 0.1),
            ("poison", "causes", "opponent", 0.1),
        ],
    ),
    ("tangled-feet", [("confusion", "requires", None, None)]),
    ("razor-wind", []),
    ("substitute", []),
]
WEATHERS = [
    ("swift-swim", [("rain", "benefit", "speed")]),
    ("drought", [("sun", "setter", None)]),
    ("dry-skin", [("sun", "drawback", None), ("rain", "benefit", None)]),
    ("solar-power", [("sun", "benefit", None)]),
    ("harvest", [("sun", "benefit", None)]),
    ("overcoat", [("sandstorm", "protection", None), ("hail", "protection", None)]),
    ("thunder", [("rain", "benefit", None), ("sun", "drawback", None)]),
    ("mirror-move", []),
    ("fly", []),
]


@pytest.mark.parametrize(("name", "expected"), EFFECTS, ids=[name for name, _ in EFFECTS])
def test_status_facts_match_the_golden_table(
    snapshot: Snapshot, lexicon: Lexicon, name: str, expected: list[tuple[object, ...]]
) -> None:
    facts = EffectClassifier(lexicon).classify(_entity(snapshot, name))
    assert [(f.effect, f.mode, f.target, f.probability) for f in facts] == expected


@pytest.mark.parametrize(("name", "expected"), WEATHERS, ids=[name for name, _ in WEATHERS])
def test_weather_facts_match_the_golden_table(
    snapshot: Snapshot, lexicon: Lexicon, name: str, expected: list[tuple[object, ...]]
) -> None:
    facts = WeatherClassifier(lexicon).classify(_entity(snapshot, name))
    assert [(f.weather, f.role, f.stat) for f in facts] == expected


def test_every_effect_a_short_effect_names_matches_a_rule(
    snapshot: Snapshot, lexicon: Lexicon
) -> None:
    classifier = EffectClassifier(lexicon)
    entities: tuple[Move | Ability, ...] = (*snapshot.moves, *snapshot.abilities)
    unmatched = [
        f"{entity.name}:{effect}"
        for entity in entities
        for effect in classifier.named_effects(entity.short_effect or "")
        if classifier.matching_rule(effect, entity.short_effect or "") is None
    ]
    assert unmatched == []
