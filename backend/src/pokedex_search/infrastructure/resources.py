"""Load versioned YAML resources shipped with the package into typed models."""

from importlib.resources import files

import yaml
from pydantic import BaseModel

RESOURCE_PACKAGE = "pokedex_search.resources"


def load_resource[ModelT: BaseModel](name: str, model: type[ModelT]) -> ModelT:
    """Parse a packaged YAML resource and validate it against a model.

    Args:
        name: File name inside the resources package.
        model: Model the content must match.

    Returns:
        The validated resource.
    """
    text = files(RESOURCE_PACKAGE).joinpath(name).read_text(encoding="utf-8")
    document: object = yaml.safe_load(text)
    return model.model_validate(document)
