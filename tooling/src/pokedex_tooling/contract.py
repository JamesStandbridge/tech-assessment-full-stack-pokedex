"""Validate API payloads against the OpenAPI contract."""

from collections.abc import Mapping
from pathlib import Path

from jsonschema import Draft202012Validator
from referencing import Registry, Resource
from referencing.jsonschema import DRAFT202012, Schema

from pokedex_tooling.paths import OPENAPI_PATH
from pokedex_tooling.specs import read_yaml

OPENAPI_URI = "urn:pokedex:openapi"


class ContractViolationError(AssertionError):
    """Raised when an API payload breaks the OpenAPI contract."""


class ContractValidator:
    """Validates payloads against schemas under components/schemas."""

    def __init__(self, openapi_path: Path = OPENAPI_PATH) -> None:
        """Load the OpenAPI document.

        Args:
            openapi_path: Location of the OpenAPI document.

        Raises:
            ValueError: If the document is not a mapping.
        """
        document = read_yaml(openapi_path)
        if not isinstance(document, Mapping):
            raise ValueError(f"{openapi_path} does not contain an OpenAPI document.")
        resource: Resource[Schema] = Resource.from_contents(
            document, default_specification=DRAFT202012
        )
        self._registry: Registry[Schema] = Registry().with_resource(OPENAPI_URI, resource)

    def validate(self, payload: object, schema_name: str) -> None:
        """Check a payload against one component schema.

        Args:
            payload: Decoded JSON payload.
            schema_name: Name under components/schemas.

        Raises:
            ContractViolationError: If the payload does not match.
        """
        schema = {"$ref": f"{OPENAPI_URI}#/components/schemas/{schema_name}"}
        validator = Draft202012Validator(schema, registry=self._registry)
        errors = sorted(validator.iter_errors(payload), key=lambda error: error.json_path)
        if errors:
            details = "; ".join(f"{error.json_path}: {error.message}" for error in errors[:5])
            raise ContractViolationError(f"Payload breaks the {schema_name} contract: {details}")
