import hashlib
from pathlib import Path

import pytest

from pokedex_search.domain.entities import DamageClass, Snapshot
from pokedex_search.domain.errors import DatasetIntegrityError
from pokedex_search.infrastructure.dataset_loader import load_snapshot
from pokedex_search.infrastructure.settings import Settings


def test_the_published_snapshot_loads_completely(snapshot: Snapshot) -> None:
    assert (len(snapshot.pokemon), len(snapshot.moves), len(snapshot.abilities)) == (151, 164, 114)
    assert snapshot.sha256 == Settings().dataset_sha256


def test_entities_are_mapped_with_their_relations(snapshot: Snapshot) -> None:
    bulbasaur = snapshot.pokemon[0]
    assert bulbasaur.name == "bulbasaur"
    assert bulbasaur.stats.special_attack == 65
    assert "sleep-powder" in bulbasaur.moves
    spore = next(move for move in snapshot.moves if move.name == "spore")
    assert spore.damage_class is DamageClass.STATUS
    assert spore.learned_by == ("paras", "parasect")


def test_texts_are_cleaned_of_soft_hyphens_and_curly_quotes(snapshot: Snapshot) -> None:
    texts = [p.species.description or "" for p in snapshot.pokemon] + [
        m.short_effect or "" for m in snapshot.moves
    ]
    assert not any("\u00ad" in text or "\u2019" in text for text in texts)


def test_an_altered_file_is_rejected(tmp_path: Path) -> None:
    dataset = tmp_path / "pokedex.json"
    dataset.write_text('{"pokemon": [], "moves": [], "abilities": []}', encoding="utf-8")
    with pytest.raises(DatasetIntegrityError, match="digest"):
        load_snapshot(dataset, "0" * 64)


def test_a_file_matching_its_digest_but_not_the_schema_is_rejected(tmp_path: Path) -> None:
    dataset = tmp_path / "pokedex.json"
    content = b'{"pokemon": "nope"}'
    dataset.write_bytes(content)
    with pytest.raises(DatasetIntegrityError, match="schema"):
        load_snapshot(dataset, hashlib.sha256(content).hexdigest())


def test_a_missing_file_points_to_prepare_data(tmp_path: Path) -> None:
    with pytest.raises(DatasetIntegrityError, match="prepare-data"):
        load_snapshot(tmp_path / "absent.json", "0" * 64)
