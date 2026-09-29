"""Typed loaders for the specification files."""

from pathlib import Path
from typing import Literal

import yaml
from pydantic import BaseModel
from pytest_bdd.gherkin_parser import Scenario, get_gherkin_document

from pokedex_tooling.entities import EntityKind
from pokedex_tooling.paths import (
    ASSESSMENTS_PATH,
    FEATURES_DIR,
    JUDGMENTS_PATH,
    REQUIREMENTS_PATH,
    THRESHOLDS_PATH,
)

Priority = Literal["must", "should", "could"]
PRIORITIES_BY_CRITICALITY: tuple[Priority, ...] = ("must", "should", "could")
PRIORITY_TAGS: frozenset[str] = frozenset({"should", "could"})


class Need(BaseModel):
    """A user need the product supports."""

    id: str
    title: str
    brief_situation: int | None


class Requirement(BaseModel):
    """One EARS requirement."""

    id: str
    need: str | None
    template: Literal["ubiquitous", "event-driven", "state-driven", "unwanted", "optional"]
    statement: str
    source: str
    priority: Priority
    verification: Literal[
        "acceptance", "api-test", "ui-test", "unit-test", "relevance-evaluation", "inspection"
    ]


class Exclusion(BaseModel):
    """Something the product deliberately does not do, and why."""

    id: str
    statement: str
    reason: str


class RequirementsDocument(BaseModel):
    """Content of specs/requirements.yaml."""

    schema_version: Literal[1]
    needs: list[Need]
    requirements: list[Requirement]
    out_of_scope: list[Exclusion]


class JudgedQuery(BaseModel):
    """A query with graded judgments per entity kind."""

    id: str
    need: str
    query: str
    grading_rule: str
    judgments: dict[EntityKind, dict[str, int]]


class JudgmentsDocument(BaseModel):
    """Content of specs/relevance/judgments.yaml."""

    schema_version: Literal[1]
    grades: dict[str, str]
    queries: list[JudgedQuery]


class MetricThreshold(BaseModel):
    """Minimum values for one relevance metric."""

    description: str
    per_query_minimum: float
    mean_minimum: float | None = None
    applies_to_needs: list[str] | None = None


class ThresholdMetrics(BaseModel):
    """Thresholds for every metric the evaluation computes."""

    ndcg: MetricThreshold
    reciprocal_rank: MetricThreshold


class AssessorThreshold(BaseModel):
    """Pre-registered minimum for scores against assessor grades."""

    ndcg_mean_minimum: float


class ThresholdsDocument(BaseModel):
    """Content of specs/relevance/thresholds.yaml."""

    schema_version: Literal[1]
    cutoff: int
    metrics: ThresholdMetrics
    assessor: AssessorThreshold


class Candidate(BaseModel):
    """A pooled candidate as the assessor sees it."""

    ref: str
    summary: str
    grade: int | None


class AssessedQuery(BaseModel):
    """A query and its pooled candidates."""

    id: str
    query: str
    candidates: list[Candidate]

    @property
    def complete(self) -> bool:
        """Tell whether every candidate has a grade."""
        return all(candidate.grade is not None for candidate in self.candidates)


class AssessmentsDocument(BaseModel):
    """Content of specs/relevance/assessments.yaml."""

    schema_version: Literal[1]
    instructions: str
    grades: dict[str, str]
    queries: list[AssessedQuery]


class RenderedStep(BaseModel):
    """A scenario step with outline placeholders replaced."""

    text: str
    table_header: str | None
    table_values: list[str]


class ScenarioRun(BaseModel):
    """One concrete run of a scenario, or of one outline example row."""

    feature_file: str
    scenario: str
    tags: list[str]
    steps: list[RenderedStep]

    @property
    def location(self) -> str:
        """Return a readable location for messages."""
        return f"{self.feature_file}: {self.scenario}"


def read_yaml(path: Path) -> object:
    """Parse a YAML file.

    Args:
        path: File to read.

    Returns:
        The parsed document.
    """
    document: object = yaml.safe_load(path.read_text(encoding="utf-8"))
    return document


def load_requirements(path: Path = REQUIREMENTS_PATH) -> RequirementsDocument:
    """Load and validate the requirements file."""
    return RequirementsDocument.model_validate(read_yaml(path))


def load_judgments(path: Path = JUDGMENTS_PATH) -> JudgmentsDocument:
    """Load and validate the relevance judgments."""
    return JudgmentsDocument.model_validate(read_yaml(path))


def load_thresholds(path: Path = THRESHOLDS_PATH) -> ThresholdsDocument:
    """Load and validate the relevance thresholds."""
    return ThresholdsDocument.model_validate(read_yaml(path))


def load_assessments(path: Path = ASSESSMENTS_PATH) -> AssessmentsDocument:
    """Load and validate the assessor grades."""
    return AssessmentsDocument.model_validate(read_yaml(path))


def _render(text: str, row: dict[str, str]) -> str:
    for key, value in row.items():
        text = text.replace(f"<{key}>", value)
    return text


def _example_rows(scenario: Scenario) -> list[dict[str, str]]:
    if not scenario.examples:
        return [{}]
    rows: list[dict[str, str]] = []
    for examples in scenario.examples:
        if examples.table_header is None:
            continue
        header = [cell.value for cell in examples.table_header.cells]
        for body_row in examples.table_body or []:
            rows.append(dict(zip(header, [cell.value for cell in body_row.cells], strict=True)))
    return rows


def load_scenario_runs(features_dir: Path = FEATURES_DIR) -> list[ScenarioRun]:
    """Expand every scenario, and every outline example row, into concrete runs.

    Args:
        features_dir: Directory holding the .feature files.

    Returns:
        Runs in file order.
    """
    runs: list[ScenarioRun] = []
    for feature_path in sorted(features_dir.glob("*.feature")):
        document = get_gherkin_document(str(feature_path))
        for child in document.feature.children:
            scenario = child.scenario
            if scenario is None:
                continue
            tags = [tag.name.removeprefix("@") for tag in scenario.tags]
            for row in _example_rows(scenario):
                steps = [
                    RenderedStep(
                        text=_render(step.text, row),
                        table_header=_render(step.datatable.rows[0].cells[0].value, row)
                        if step.datatable
                        else None,
                        table_values=[
                            _render(table_row.cells[0].value, row)
                            for table_row in step.datatable.rows[1:]
                        ]
                        if step.datatable
                        else [],
                    )
                    for step in scenario.steps
                ]
                runs.append(
                    ScenarioRun(
                        feature_file=feature_path.name,
                        scenario=scenario.name,
                        tags=tags,
                        steps=steps,
                    )
                )
    return runs
