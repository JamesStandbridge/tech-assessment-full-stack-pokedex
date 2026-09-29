"""The health use case."""

from pokedex_search.application.ports import EntityCatalog


class HealthService:
    """Reports which dataset is served."""

    def __init__(self, catalog: EntityCatalog) -> None:
        """Keep the catalog.

        Args:
            catalog: Read access to entities, source of the dataset version.
        """
        self._catalog = catalog

    def dataset_version(self) -> str:
        """Return the checksum of the dataset served."""
        return self._catalog.version()
