"""Runtime settings read from the environment."""

from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

PUBLISHED_SHA256 = "251b7a02837bcb01a491e40de488ef179c95df7d7cb7e0aec1f4562d9d16cadb"
DEFAULT_DATASET_PATH = Path(__file__).resolve().parents[4] / "data" / "pokedex.json"


class Settings(BaseSettings):
    """Settings of the search API, prefixed POKEDEX_ in the environment."""

    model_config = SettingsConfigDict(env_prefix="POKEDEX_", env_file=".env", extra="ignore")

    dataset_path: Path = DEFAULT_DATASET_PATH
    dataset_sha256: str = PUBLISHED_SHA256
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])
    host: str = "127.0.0.1"
    port: int = 8000
    ranking_cache_size: int = 512
