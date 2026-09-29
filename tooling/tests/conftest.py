import os
from collections.abc import Callable, Iterator

import pytest

from pokedex_tooling.client import (
    API_URL_VARIABLE,
    DEFAULT_API_URL,
    SearchApiUnavailableError,
    SearchClient,
)
from pokedex_tooling.contract import ContractValidator
from pokedex_tooling.specs import PRIORITY_TAGS


@pytest.fixture(scope="session")
def contract() -> ContractValidator:
    return ContractValidator()


@pytest.fixture(scope="session")
def search_client(contract: ContractValidator) -> Iterator[SearchClient]:
    client = SearchClient(
        base_url=os.environ.get(API_URL_VARIABLE, DEFAULT_API_URL), contract=contract
    )
    try:
        client.ensure_available()
    except SearchApiUnavailableError as error:
        client.close()
        pytest.exit(str(error), returncode=1)
    yield client
    client.close()


def pytest_bdd_apply_tag(tag: str, function: Callable[..., object]) -> bool:
    marker = getattr(pytest.mark, tag) if tag in PRIORITY_TAGS else pytest.mark.requirement(tag)
    marker(function)
    return True
