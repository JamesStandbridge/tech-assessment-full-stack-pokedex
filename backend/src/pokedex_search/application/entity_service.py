"""The entity detail use case."""

from pokedex_search.application.ports import EntityCatalog
from pokedex_search.domain.details import EntityDetail
from pokedex_search.domain.entities import EntityKind, EntityRef, Pokemon
from pokedex_search.domain.errors import EntityNotFoundError


class EntityService:
    """Returns one entity with its relations."""

    def __init__(self, catalog: EntityCatalog) -> None:
        """Keep the catalog.

        Args:
            catalog: Read access to entities.
        """
        self._catalog = catalog

    def get(self, kind: EntityKind, name: str) -> EntityDetail:
        """Return an entity and, for a Pokémon, its evolution family.

        Args:
            kind: Kind of the entity.
            name: Kebab-case name.

        Returns:
            The entity detail.

        Raises:
            EntityNotFoundError: If no entity of this kind has this name.
        """
        ref = EntityRef(kind=kind, name=name)
        entity = self._catalog.get(ref)
        if entity is None:
            raise EntityNotFoundError(ref)
        family = self._catalog.evolution_family(entity) if isinstance(entity, Pokemon) else ()
        return EntityDetail(entity=entity, evolution_family=family)

    def species(self) -> tuple[Pokemon, ...]:
        """Return every Pokémon, in Pokédex order.

        Returns:
            The Pokémon of the snapshot, sorted by number.
        """
        found = (self._catalog.get(ref) for ref in self._catalog.refs(EntityKind.POKEMON))
        return tuple(
            sorted((entity for entity in found if isinstance(entity, Pokemon)), key=_number)
        )


def _number(pokemon: Pokemon) -> int:
    return pokemon.id
