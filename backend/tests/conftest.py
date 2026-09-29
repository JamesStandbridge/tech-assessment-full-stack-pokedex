import pytest

from pokedex_search.domain.entities import Snapshot
from pokedex_search.infrastructure.dataset_loader import load_snapshot
from pokedex_search.infrastructure.settings import Settings


@pytest.fixture(scope="session")
def snapshot() -> Snapshot:
    settings = Settings()
    return load_snapshot(settings.dataset_path, settings.dataset_sha256)
