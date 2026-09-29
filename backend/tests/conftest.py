import pytest

from pokedex_search.core.query.canonical import CanonicalWriter
from pokedex_search.core.query.genus import genus_words
from pokedex_search.core.query.parser import VocabularyQueryParser
from pokedex_search.core.query.phrases import PhraseTable, build_phrase_table
from pokedex_search.core.query.vocabulary import Vocabulary
from pokedex_search.domain.entities import Entity, Snapshot
from pokedex_search.infrastructure.dataset_loader import load_snapshot
from pokedex_search.infrastructure.resources import load_resource
from pokedex_search.infrastructure.settings import Settings


@pytest.fixture(scope="session")
def snapshot() -> Snapshot:
    settings = Settings()
    return load_snapshot(settings.dataset_path, settings.dataset_sha256)


@pytest.fixture(scope="session")
def vocabulary() -> Vocabulary:
    return load_resource("vocabulary.yaml", Vocabulary)


@pytest.fixture(scope="session")
def table(vocabulary: Vocabulary, snapshot: Snapshot) -> PhraseTable:
    entities: tuple[Entity, ...] = (*snapshot.pokemon, *snapshot.moves, *snapshot.abilities)
    return build_phrase_table(
        vocabulary, [entity.ref for entity in entities], genus_words(snapshot.pokemon)
    )


@pytest.fixture(scope="session")
def parser(table: PhraseTable) -> VocabularyQueryParser:
    return VocabularyQueryParser(table)


@pytest.fixture(scope="session")
def writer(vocabulary: Vocabulary) -> CanonicalWriter:
    return CanonicalWriter(vocabulary)
