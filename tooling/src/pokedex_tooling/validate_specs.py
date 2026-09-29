"""Check that the specification files are valid, consistent and traceable."""

import json
import re
import sys
from collections.abc import Mapping
from pathlib import Path

from jsonschema import Draft202012Validator
from jsonschema.exceptions import SchemaError
from openapi_spec_validator import validate as validate_openapi
from openapi_spec_validator.validation.exceptions import OpenAPIValidationError
from pydantic import BaseModel, ValidationError
from pytest_bdd.exceptions import GherkinParseError

from pokedex_tooling import vocabulary
from pokedex_tooling.entities import EntityKind, EntityRef
from pokedex_tooling.paths import (
    ASSESSMENTS_PATH,
    DATASET_PATH,
    FEATURES_DIR,
    JUDGMENTS_PATH,
    OPENAPI_PATH,
    REQUIREMENTS_PATH,
    SCHEMAS_DIR,
    UI_FEATURES_DIR,
)
from pokedex_tooling.specs import (
    PRIORITIES_BY_CRITICALITY,
    PRIORITY_TAGS,
    AssessmentsDocument,
    JudgmentsDocument,
    RequirementsDocument,
    ScenarioRun,
    ThresholdsDocument,
    load_assessments,
    load_judgments,
    load_requirements,
    load_scenario_runs,
    load_thresholds,
    read_yaml,
)


class Problem(BaseModel):
    """One inconsistency found in the specifications."""

    location: str
    message: str

    def __str__(self) -> str:
        """Return a one-line description."""
        return f"{self.location}: {self.message}"


class DatasetIndex(BaseModel):
    """The entity references and Pokémon types present in the dataset."""

    refs: frozenset[EntityRef]
    types: frozenset[str]


class ScenarioExpectations(BaseModel):
    """Entities that the scenarios of one query require or forbid."""

    required: set[EntityRef]
    forbidden: set[EntityRef]


class ScenarioCheck(BaseModel):
    """Problems found in the scenarios, and the expectations they declare per query."""

    problems: list[Problem]
    expectations: dict[str, ScenarioExpectations]


def _load_json(path: Path) -> object:
    document: object = json.loads(path.read_text(encoding="utf-8"))
    return document


def load_dataset_index(path: Path = DATASET_PATH) -> DatasetIndex:
    """Index the entities of the dataset.

    Args:
        path: Location of pokedex.json.

    Returns:
        The references and types found in the dataset.
    """
    dataset = json.loads(path.read_text(encoding="utf-8"))
    refs = {
        EntityRef(kind=kind, name=entry["name"])
        for kind, key in (
            (EntityKind.POKEMON, "pokemon"),
            (EntityKind.MOVE, "moves"),
            (EntityKind.ABILITY, "abilities"),
        )
        for entry in dataset[key]
    }
    types = {type_name for pokemon in dataset["pokemon"] for type_name in pokemon["types"]}
    return DatasetIndex(refs=frozenset(refs), types=frozenset(types))


def check_json_schemas(dataset_available: bool) -> list[Problem]:
    """Validate the schemas themselves, then the files they describe.

    Args:
        dataset_available: Whether pokedex.json exists and can be validated.

    Returns:
        The problems found.
    """
    problems: list[Problem] = []
    targets: dict[str, Path] = {
        "requirements.schema.json": REQUIREMENTS_PATH,
        "judgments.schema.json": JUDGMENTS_PATH,
        "assessments.schema.json": ASSESSMENTS_PATH,
    }
    if dataset_available:
        targets["pokedex.schema.json"] = DATASET_PATH
    for schema_name, target in targets.items():
        schema = _load_json(SCHEMAS_DIR / schema_name)
        if not isinstance(schema, Mapping):
            problems.append(Problem(location=schema_name, message="Schema is not an object."))
            continue
        try:
            Draft202012Validator.check_schema(schema)
        except SchemaError as error:
            problems.append(Problem(location=schema_name, message=error.message))
            continue
        instance = _load_json(target) if target.suffix == ".json" else read_yaml(target)
        problems.extend(
            Problem(location=f"{target.name} {error.json_path}", message=error.message)
            for error in Draft202012Validator(schema).iter_errors(instance)
        )
    return problems


def check_openapi() -> list[Problem]:
    """Validate the OpenAPI document against the OpenAPI 3.1 specification."""
    document = read_yaml(OPENAPI_PATH)
    if not isinstance(document, Mapping):
        return [Problem(location=OPENAPI_PATH.name, message="Document is not an object.")]
    try:
        validate_openapi(document)
    except OpenAPIValidationError as error:
        return [Problem(location=OPENAPI_PATH.name, message=str(error).splitlines()[0])]
    return []


def check_requirements(requirements: RequirementsDocument) -> list[Problem]:
    """Check identifiers and need references in the requirements and exclusions."""
    problems: list[Problem] = []
    need_ids = {need.id for need in requirements.needs}
    seen: set[str] = set()
    for identifier in [requirement.id for requirement in requirements.requirements] + [
        exclusion.id for exclusion in requirements.out_of_scope
    ]:
        if identifier in seen:
            problems.append(Problem(location=identifier, message="Duplicate identifier."))
        seen.add(identifier)
    problems.extend(
        Problem(location=requirement.id, message=f"Unknown need {requirement.need!r}.")
        for requirement in requirements.requirements
        if requirement.need is not None and requirement.need not in need_ids
    )
    return problems


def _parse_ref(
    value: str, location: str, index: DatasetIndex, problems: list[Problem]
) -> EntityRef | None:
    try:
        ref = EntityRef.parse(value)
    except ValueError as error:
        problems.append(Problem(location=location, message=str(error)))
        return None
    if ref not in index.refs:
        problems.append(Problem(location=location, message=f"{ref} is not in the dataset."))
        return None
    return ref


def _match_step(text: str) -> re.Match[str] | None:
    for pattern in vocabulary.STEP_PATTERNS:
        match = re.fullmatch(pattern, text)
        if match is not None:
            return match
    return None


def _check_term(match: re.Match[str], query: str, location: str, problems: list[Problem]) -> None:
    if "term" not in match.re.groupindex:
        return
    term = match.group("term")
    if re.search(rf"(?<!\w){re.escape(term)}(?!\w)", query, re.IGNORECASE) is None:
        problems.append(
            Problem(location=location, message=f"The term {term!r} is not a word of {query!r}.")
        )
    if "role" in match.re.groupindex and match.group("role") not in (
        vocabulary.RECOGNIZED_TERM_ROLES
    ):
        problems.append(
            Problem(location=location, message=f"Unknown term role {match.group('role')!r}.")
        )


def _check_tags(
    run: ScenarioRun, requirements: RequirementsDocument, problems: list[Problem]
) -> list[str]:
    by_id = {requirement.id: requirement for requirement in requirements.requirements}
    requirement_tags = [tag for tag in run.tags if tag not in PRIORITY_TAGS]
    if not requirement_tags:
        problems.append(Problem(location=run.location, message="No requirement tag."))
    for tag in requirement_tags:
        if tag not in by_id:
            problems.append(
                Problem(location=run.location, message=f"Unknown requirement tag {tag}.")
            )
    verified = {by_id[tag].priority for tag in requirement_tags if tag in by_id}
    most_critical = next(
        (priority for priority in PRIORITIES_BY_CRITICALITY if priority in verified), None
    )
    expected_tags = {most_critical} & PRIORITY_TAGS
    actual_tags = set(run.tags) & PRIORITY_TAGS
    if most_critical is not None and actual_tags != expected_tags:
        expected = f"@{most_critical}" if expected_tags else "no priority tag"
        problems.append(
            Problem(
                location=run.location,
                message=f"Expected {expected}, since the most critical verified requirement "
                f"is {most_critical}.",
            )
        )
    return requirement_tags


def check_scenarios(
    runs: list[ScenarioRun], requirements: RequirementsDocument, index: DatasetIndex
) -> ScenarioCheck:
    """Check tags, steps and entity references in every scenario run.

    Args:
        runs: Scenario runs expanded from the feature files.
        requirements: The requirements the tags refer to.
        index: Entities present in the dataset.

    Returns:
        The problems found, and the expectations collected per query.
    """
    problems: list[Problem] = []
    expectations: dict[str, ScenarioExpectations] = {}
    tagged: set[str] = set()
    for run in runs:
        tagged.update(_check_tags(run, requirements, problems))
        query: str | None = None
        for step in run.steps:
            match = _match_step(step.text)
            if match is None:
                problems.append(
                    Problem(location=run.location, message=f"Unknown step {step.text!r}.")
                )
                continue
            pattern = match.re.pattern
            if pattern == vocabulary.SEARCH:
                query = match.group("query")
                expectations.setdefault(
                    query, ScenarioExpectations(required=set(), forbidden=set())
                )
                continue
            if query is None:
                problems.append(
                    Problem(location=run.location, message="Assertion before any search.")
                )
                continue
            expected = expectations[query]
            if pattern == vocabulary.OUTCOME and vocabulary.is_invalid_query(query) != (
                match.group("outcome") == "invalid"
            ):
                problems.append(
                    Problem(
                        location=run.location,
                        message=f"Outcome contradicts the input rules for {query!r}.",
                    )
                )
            if (
                pattern == vocabulary.EVERY_POKEMON_HAS_TYPE
                and match.group("type_name") not in index.types
            ):
                problems.append(
                    Problem(
                        location=run.location,
                        message=f"Unknown type {match.group('type_name')!r}.",
                    )
                )
            _check_term(match, query, run.location, problems)
            if pattern == vocabulary.NOTICE and match.group("code") not in vocabulary.NOTICE_CODES:
                problems.append(
                    Problem(
                        location=run.location,
                        message=f"Unknown notice code {match.group('code')!r}.",
                    )
                )
            for group in vocabulary.REFERENCE_GROUPS:
                if group in match.re.groupindex:
                    ref = _parse_ref(match.group(group), run.location, index, problems)
                    if ref is not None and group != "second":
                        expected.required.add(ref)
            if pattern in vocabulary.TABLE_STEPS:
                if step.table_header != vocabulary.TABLE_HEADER or not step.table_values:
                    problems.append(
                        Problem(
                            location=run.location,
                            message=(
                                f"Step {step.text!r} needs a '{vocabulary.TABLE_HEADER}' table."
                            ),
                        )
                    )
                target = (
                    expected.forbidden
                    if pattern == vocabulary.RESULTS_EXCLUDE
                    else expected.required
                )
                for value in step.table_values:
                    ref = _parse_ref(value, run.location, index, problems)
                    if ref is not None:
                        target.add(ref)
    for query, expected in expectations.items():
        clash = expected.required & expected.forbidden
        if clash:
            problems.append(
                Problem(
                    location=f"query {query!r}",
                    message=f"Both required and forbidden: {sorted(map(str, clash))}.",
                )
            )
    problems.extend(
        Problem(location=requirement.id, message="No scenario verifies this requirement.")
        for requirement in requirements.requirements
        if requirement.verification == "acceptance" and requirement.id not in tagged
    )
    return ScenarioCheck(problems=problems, expectations=expectations)


def check_ui_scenarios(
    runs: list[ScenarioRun], requirements: RequirementsDocument
) -> list[Problem]:
    """Check the tags of the interface scenarios and their coverage of ui-test requirements.

    Their steps are checked by the frontend test runner, which fails on any step
    without a definition.

    Args:
        runs: Scenario runs expanded from the interface feature files.
        requirements: The requirements the tags refer to.

    Returns:
        The problems found.
    """
    by_id = {requirement.id: requirement for requirement in requirements.requirements}
    problems: list[Problem] = []
    tagged: set[str] = set()
    for run in runs:
        tags = _check_tags(run, requirements, problems)
        tagged.update(tags)
        problems.extend(
            Problem(location=run.location, message=f"{tag} is not verified by ui-test.")
            for tag in tags
            if tag in by_id and by_id[tag].verification != "ui-test"
        )
    problems.extend(
        Problem(location=requirement.id, message="No interface scenario verifies this requirement.")
        for requirement in requirements.requirements
        if requirement.verification == "ui-test" and requirement.id not in tagged
    )
    return problems


def check_judgments(
    judgments: JudgmentsDocument,
    requirements: RequirementsDocument,
    expectations: dict[str, ScenarioExpectations],
    index: DatasetIndex,
) -> list[Problem]:
    """Check that judgments name real entities and agree with the scenarios.

    Args:
        judgments: Graded relevance judgments.
        requirements: Source of the known needs.
        expectations: Entities required or forbidden per query by the scenarios.
        index: Entities present in the dataset.

    Returns:
        The problems found.
    """
    problems: list[Problem] = []
    need_ids = {need.id for need in requirements.needs}
    seen: set[str] = set()
    for judged in judgments.queries:
        if judged.id in seen:
            problems.append(Problem(location=judged.id, message="Duplicate identifier."))
        seen.add(judged.id)
        if judged.need not in need_ids:
            problems.append(Problem(location=judged.id, message=f"Unknown need {judged.need!r}."))
        graded = {
            EntityRef(kind=kind, name=name)
            for kind, grades in judged.judgments.items()
            for name in grades
        }
        problems.extend(
            Problem(location=judged.id, message=f"{ref} is not in the dataset.")
            for ref in sorted(graded - index.refs, key=str)
        )
        expected = expectations.get(judged.query)
        if expected is None:
            problems.append(Problem(location=judged.id, message="No scenario runs this query."))
            continue
        forbidden = sorted(map(str, graded & expected.forbidden))
        if forbidden:
            problems.append(
                Problem(
                    location=judged.id, message=f"Graded but forbidden by a scenario: {forbidden}."
                )
            )
        ungraded = sorted(
            str(ref) for ref in expected.required - graded if ref.kind in judged.judgments
        )
        if ungraded:
            problems.append(
                Problem(
                    location=judged.id,
                    message=f"Required by a scenario but not graded: {ungraded}.",
                )
            )
    return problems


USER_QUERY_ID = re.compile(r"^Q-USER-[0-9]{2}$")


def check_assessments(
    assessments: AssessmentsDocument, judgments: JudgmentsDocument, index: DatasetIndex
) -> list[Problem]:
    """Check that the assessment sheet covers every judged query with real entities.

    Args:
        assessments: The assessment sheet.
        judgments: Rule judgments, whose queries must all be pooled.
        index: Entities present in the dataset.

    Returns:
        The problems found.
    """
    problems: list[Problem] = []
    judged = {query.id: query.query for query in judgments.queries}
    seen: set[str] = set()
    for query in assessments.queries:
        if query.id in seen:
            problems.append(Problem(location=query.id, message="Duplicate identifier."))
        seen.add(query.id)
        if query.id in judged and judged[query.id] != query.query:
            problems.append(
                Problem(location=query.id, message="Query text differs from the judgments.")
            )
        if query.id not in judged and USER_QUERY_ID.fullmatch(query.id) is None:
            problems.append(
                Problem(location=query.id, message="Queries added by assessors use Q-USER-nn.")
            )
        refs: set[str] = set()
        for candidate in query.candidates:
            if candidate.ref in refs:
                problems.append(
                    Problem(location=query.id, message=f"Duplicate candidate {candidate.ref}.")
                )
            refs.add(candidate.ref)
            _parse_ref(candidate.ref, query.id, index, problems)
    problems.extend(
        Problem(location=query_id, message="Judged query missing; run pool-assessments.")
        for query_id in judged
        if query_id not in seen
    )
    return problems


def check_thresholds(
    thresholds: ThresholdsDocument, requirements: RequirementsDocument
) -> list[Problem]:
    """Check that thresholds are within range and name known needs."""
    problems: list[Problem] = []
    need_ids = {need.id for need in requirements.needs}
    if thresholds.cutoff < 1:
        problems.append(Problem(location="thresholds", message="The cutoff must be at least 1."))
    for name, metric in (
        ("ndcg", thresholds.metrics.ndcg),
        ("reciprocal_rank", thresholds.metrics.reciprocal_rank),
    ):
        for bound in (metric.per_query_minimum, metric.mean_minimum):
            if bound is not None and not 0.0 <= bound <= 1.0:
                problems.append(
                    Problem(location=f"thresholds {name}", message=f"{bound} is outside [0, 1].")
                )
        problems.extend(
            Problem(location=f"thresholds {name}", message=f"Unknown need {need!r}.")
            for need in metric.applies_to_needs or []
            if need not in need_ids
        )
    return problems


def validate_all() -> list[Problem]:
    """Run every check on the specification files.

    Returns:
        Every problem found; an empty list means the specifications are consistent.
    """
    dataset_available = DATASET_PATH.exists()
    problems = check_json_schemas(dataset_available) + check_openapi()
    if not dataset_available:
        problems.append(
            Problem(location=str(DATASET_PATH), message="Missing dataset; run prepare-data.")
        )
    try:
        requirements = load_requirements()
        judgments = load_judgments()
        thresholds = load_thresholds()
        assessments = load_assessments()
        runs = load_scenario_runs(FEATURES_DIR)
        ui_runs = load_scenario_runs(UI_FEATURES_DIR)
    except (ValidationError, GherkinParseError) as error:
        return [*problems, Problem(location="specs", message=str(error).splitlines()[0])]
    problems += check_requirements(requirements) + check_thresholds(thresholds, requirements)
    problems += check_ui_scenarios(ui_runs, requirements)
    if not dataset_available:
        return problems
    index = load_dataset_index()
    scenario_check = check_scenarios(runs, requirements, index)
    problems += scenario_check.problems
    problems += check_judgments(judgments, requirements, scenario_check.expectations, index)
    problems += check_assessments(assessments, judgments, index)
    return problems


def main() -> None:
    """Report specification problems and exit with a non-zero code if any exist."""
    problems = validate_all()
    for problem in problems:
        print(problem, file=sys.stderr)
    if problems:
        print(f"{len(problems)} problem(s) found.", file=sys.stderr)
        sys.exit(1)
    requirements = load_requirements()
    runs = load_scenario_runs(FEATURES_DIR)
    ui_runs = load_scenario_runs(UI_FEATURES_DIR)
    judgments = load_judgments()
    print(
        f"Specifications are consistent: {len(requirements.requirements)} requirements, "
        f"{len(runs)} scenario runs, {len(ui_runs)} interface scenario runs, "
        f"{len(judgments.queries)} judged queries."
    )
