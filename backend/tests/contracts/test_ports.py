import pytest

from pokedex_search.application.facets import Facet, FacetName
from pokedex_search.bootstrap import build_index
from pokedex_search.core.ranking.names import NameTier
from pokedex_search.domain.entities import EntityKind, Snapshot
from pokedex_search.domain.stats import StatName
from pokedex_search.infrastructure.memory_index import InMemoryIndex
from tests.fakes.index import FakeIndex

ALL_KINDS = frozenset(EntityKind)
Index = InMemoryIndex | FakeIndex


@pytest.fixture(scope="module", params=["in-memory", "fake"])
def index(request: pytest.FixtureRequest, snapshot: Snapshot) -> Index:
    if request.param == "in-memory":
        return build_index(snapshot)
    type_facet = Facet(name=FacetName.TYPE, value="electric")
    electric = frozenset(p.ref for p in snapshot.pokemon if "electric" in p.types)
    return FakeIndex(snapshot.pokemon, facets={type_facet: electric})


def test_every_reference_resolves_to_an_entity_of_its_kind(index: Index) -> None:
    for kind in EntityKind:
        for ref in index.refs(kind):
            entity = index.get(ref)
            assert entity is not None
            assert entity.ref == ref


def test_facets_return_known_entities_and_consistent_counts(index: Index) -> None:
    facet = Facet(name=FacetName.TYPE, value="electric")
    known = frozenset().union(*(index.refs(kind) for kind in EntityKind))
    assert index.having(facet) <= known
    assert index.count(facet) == len(index.having(facet))


def test_name_matches_respect_kinds_and_come_sorted_by_tier(index: Index) -> None:
    matches = index.match("pika", frozenset({EntityKind.POKEMON}))
    assert matches
    assert all(match.ref.kind is EntityKind.POKEMON for match in matches)
    assert [match.tier for match in matches] == sorted(match.tier for match in matches)
    assert all(match.tier is not NameTier.FUZZY for match in matches)


def test_profiles_belong_to_the_requested_entity(index: Index) -> None:
    ref = next(iter(index.refs(EntityKind.POKEMON)))
    assert index.profile(ref).ref == ref


def test_percentile_ranks_stay_between_zero_and_one(index: Index) -> None:
    table = index.percentiles(StatName.SPEED)
    assert 0 <= table.rank(0) <= table.rank(80) <= table.rank(200) <= 1
