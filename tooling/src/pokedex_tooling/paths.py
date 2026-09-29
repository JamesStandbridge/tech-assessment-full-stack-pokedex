"""Filesystem locations shared by the tooling."""

from pathlib import Path

REPO_ROOT: Path = Path(__file__).resolve().parents[3]
SPECS_DIR: Path = REPO_ROOT / "specs"
FEATURES_DIR: Path = SPECS_DIR / "features"
REQUIREMENTS_PATH: Path = SPECS_DIR / "requirements.yaml"
JUDGMENTS_PATH: Path = SPECS_DIR / "relevance" / "judgments.yaml"
THRESHOLDS_PATH: Path = SPECS_DIR / "relevance" / "thresholds.yaml"
ASSESSMENTS_PATH: Path = SPECS_DIR / "relevance" / "assessments.yaml"
OPENAPI_PATH: Path = SPECS_DIR / "api" / "openapi.yaml"
SCHEMAS_DIR: Path = SPECS_DIR / "schemas"
DATASET_PATH: Path = REPO_ROOT / "data" / "pokedex.json"
