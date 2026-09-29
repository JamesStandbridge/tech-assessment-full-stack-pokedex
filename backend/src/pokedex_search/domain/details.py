"""An entity with the relations the detail view shows."""

from pokedex_search.domain.entities import Entity, Frozen


class EntityDetail(Frozen):
    """One entity, and the Pokémon of its evolution family when it is a Pokémon."""

    entity: Entity
    evolution_family: tuple[str, ...]
