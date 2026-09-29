import pytest

from pokedex_tooling.entities import EntityKind, EntityRef
from pokedex_tooling.specs import (
    Exclusion,
    Need,
    RenderedStep,
    Requirement,
    RequirementsDocument,
    ScenarioRun,
)
from pokedex_tooling.validate_specs import (
    DatasetIndex,
    check_requirements,
    check_scenarios,
    check_ui_scenarios,
    validate_all,
)

INDEX = DatasetIndex(
    refs=frozenset(
        {
            EntityRef(kind=EntityKind.POKEMON, name="mew"),
            EntityRef(kind=EntityKind.POKEMON, name="mewtwo"),
        }
    ),
    types=frozenset({"psychic"}),
)
REQUIREMENTS = RequirementsDocument(
    schema_version=1,
    needs=[Need(id="name-recovery", title="Names", brief_situation=1)],
    requirements=[
        Requirement(
            id="SRCH-NAME-002",
            need="name-recovery",
            template="event-driven",
            statement="When a query matches, the service shall rank it first.",
            source="product",
            priority="must",
            verification="acceptance",
        ),
        Requirement(
            id="SRCH-NAME-006",
            need="name-recovery",
            template="optional",
            statement="Where a query is a number, the service shall find it.",
            source="product",
            priority="should",
            verification="acceptance",
        ),
        Requirement(
            id="SRCH-NAME-007",
            need="name-recovery",
            template="optional",
            statement="Where a query is spoken, the service shall transcribe it.",
            source="product",
            priority="could",
            verification="acceptance",
        ),
    ],
    out_of_scope=[Exclusion(id="OUT-001", statement="Accounts.", reason="Excluded by the brief.")],
)


def step(text: str, values: list[str] | None = None) -> RenderedStep:
    return RenderedStep(
        text=text, table_header="result" if values else None, table_values=values or []
    )


def run(tags: list[str], *steps: RenderedStep) -> ScenarioRun:
    return ScenarioRun(feature_file="test.feature", scenario="case", tags=tags, steps=list(steps))


def messages(*runs: ScenarioRun) -> list[str]:
    return [
        problem.message for problem in check_scenarios(list(runs), REQUIREMENTS, INDEX).problems
    ]


VALID_RUNS = (
    run(["SRCH-NAME-002"], step('I search for "mew"'), step('the first result is "pokemon:mew"')),
    run(["SRCH-NAME-006", "should"], step('I search for "#151"'), step('the outcome is "results"')),
    run(["SRCH-NAME-007", "could"], step('I search for "mew"')),
    run(["SRCH-NAME-002", "SRCH-NAME-006"], step('I search for "mew"')),
    run(
        ["SRCH-NAME-002"],
        step('I search for "highest sp atk pokemon"'),
        step('the term "sp atk" is recognized as stat'),
    ),
)


def test_the_repository_specifications_are_consistent() -> None:
    problems = validate_all()
    assert not problems, "\n".join(map(str, problems))


def test_valid_runs_raise_no_problem() -> None:
    assert messages(*VALID_RUNS) == []


@pytest.mark.parametrize(
    ("broken", "expected"),
    [
        (run(["SRCH-NAME-999"], step('I search for "mew"')), "Unknown requirement tag"),
        (run([], step('I search for "mew"')), "No requirement tag"),
        (run(["SRCH-NAME-006"], step('I search for "#151"')), "Expected @should"),
        (run(["SRCH-NAME-007", "should"], step('I search for "mew"')), "Expected @could"),
        (run(["SRCH-NAME-002", "should"], step('I search for "mew"')), "no priority tag"),
        (
            run(["SRCH-NAME-006", "SRCH-NAME-007", "could"], step('I search for "mew"')),
            "Expected @should",
        ),
        (
            run(["SRCH-NAME-002"], step('I search for "mew"'), step("the moon is full")),
            "Unknown step",
        ),
        (run(["SRCH-NAME-002"], step('the first result is "pokemon:mew"')), "before any search"),
        (
            run(
                ["SRCH-NAME-002"],
                step('I search for "mew"'),
                step('the first result is "pokemon:missingno"'),
            ),
            "not in the dataset",
        ),
        (
            run(["SRCH-NAME-002"], step('I search for "mew"'), step('the first result is "mew"')),
            "kind:name",
        ),
        (
            run(["SRCH-NAME-002"], step('I search for "a"'), step('the outcome is "results"')),
            "input rules",
        ),
        (
            run(
                ["SRCH-NAME-002"],
                step('I search for "mew"'),
                step('every pokemon result has the type "dark"'),
            ),
            "Unknown type",
        ),
        (
            run(["SRCH-NAME-002"], step('I search for "mew"'), step("the results include:")),
            "table",
        ),
        (
            run(
                ["SRCH-NAME-002"], step('I search for "mew"'), step('the term "mewtwo" is ignored')
            ),
            "not a word",
        ),
        (
            run(
                ["SRCH-NAME-002"],
                step('I search for "mew"'),
                step('the term "mew" is recognized as legend'),
            ),
            "Unknown term role",
        ),
        (
            run(
                ["SRCH-NAME-002"],
                step('I search for "mew"'),
                step('the response includes a "made-up" notice'),
            ),
            "Unknown notice code",
        ),
        (
            run(
                ["SRCH-NAME-002"],
                step('I search for "mew"'),
                step("the results include:", ["pokemon:mewtwo"]),
                step("the results exclude:", ["pokemon:mewtwo"]),
            ),
            "Both required and forbidden",
        ),
    ],
)
def test_broken_runs_are_reported(broken: ScenarioRun, expected: str) -> None:
    assert any(expected in message for message in messages(*VALID_RUNS, broken))


def test_identifiers_are_unique_across_requirements_and_exclusions() -> None:
    assert check_requirements(REQUIREMENTS) == []
    clashing = REQUIREMENTS.model_copy(
        update={
            "out_of_scope": [
                *REQUIREMENTS.out_of_scope,
                Exclusion(id="OUT-001", statement="Again.", reason="Duplicate."),
            ]
        }
    )
    assert [problem.message for problem in check_requirements(clashing)] == [
        "Duplicate identifier."
    ]


def test_uncovered_acceptance_requirements_are_reported() -> None:
    assert "No scenario verifies this requirement." in messages(VALID_RUNS[0])


UI_REQUIREMENTS = REQUIREMENTS.model_copy(
    update={
        "requirements": [
            *REQUIREMENTS.requirements,
            Requirement(
                id="SYS-UI-001",
                need=None,
                template="state-driven",
                statement="While a search runs, the web interface shall show a loading state.",
                source="brief/R1",
                priority="must",
                verification="ui-test",
            ),
        ]
    }
)


def ui_messages(*runs: ScenarioRun) -> list[str]:
    return [problem.message for problem in check_ui_scenarios(list(runs), UI_REQUIREMENTS)]


def test_every_ui_requirement_needs_an_interface_scenario() -> None:
    assert ui_messages() == ["No interface scenario verifies this requirement."]
    assert ui_messages(run(["SYS-UI-001"], step("I open the Pokédex"))) == []


def test_interface_scenarios_verify_only_ui_requirements() -> None:
    assert ui_messages(run(["SYS-UI-001", "SRCH-NAME-002"], step("I open the Pokédex"))) == [
        "SRCH-NAME-002 is not verified by ui-test."
    ]
