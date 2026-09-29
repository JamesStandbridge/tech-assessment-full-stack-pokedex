from collections.abc import Mapping
from pathlib import Path

import yaml
from jsonschema import Draft202012Validator
from referencing import Registry, Resource
from referencing.jsonschema import DRAFT202012, Schema

OPENAPI_PATH = Path(__file__).resolve().parents[3] / "specs" / "api" / "openapi.yaml"
OPENAPI_URI = "urn:pokedex:openapi"


class OpenApiContract:
    """Validates payloads against components of the written contract."""

    def __init__(self) -> None:
        document = yaml.safe_load(OPENAPI_PATH.read_text(encoding="utf-8"))
        assert isinstance(document, Mapping)
        resource: Resource[Schema] = Resource.from_contents(
            document, default_specification=DRAFT202012
        )
        self._registry: Registry[Schema] = Registry().with_resource(OPENAPI_URI, resource)

    def errors(self, payload: object, schema_name: str) -> list[str]:
        schema = {"$ref": f"{OPENAPI_URI}#/components/schemas/{schema_name}"}
        validator = Draft202012Validator(schema, registry=self._registry)
        return [f"{error.json_path}: {error.message}" for error in validator.iter_errors(payload)]
