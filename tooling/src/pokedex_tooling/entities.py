"""References to dataset entities, written as 'kind:name' in specifications."""

from enum import StrEnum
from typing import Self

from pydantic import BaseModel, ConfigDict


class EntityKind(StrEnum):
    """Kinds of entity the search can return."""

    POKEMON = "pokemon"
    MOVE = "move"
    ABILITY = "ability"


class EntityRef(BaseModel):
    """A dataset entity identified by its kind and kebab-case name."""

    model_config = ConfigDict(frozen=True)

    kind: EntityKind
    name: str

    @classmethod
    def parse(cls, value: str) -> Self:
        """Parse a 'kind:name' reference.

        Args:
            value: Reference such as 'move:spore'.

        Returns:
            The parsed reference.

        Raises:
            ValueError: If the reference is malformed or the kind is unknown.
        """
        kind, separator, name = value.partition(":")
        if not separator or not name:
            raise ValueError(f"Entity reference must look like 'kind:name', got {value!r}.")
        return cls(kind=EntityKind(kind), name=name)

    def __str__(self) -> str:
        """Return the 'kind:name' form."""
        return f"{self.kind}:{self.name}"
