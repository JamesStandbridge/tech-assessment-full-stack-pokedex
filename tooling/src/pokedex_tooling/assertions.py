"""Assertions behind the Gherkin steps, with messages that show the actual ranking."""

from collections.abc import Sequence

from pokedex_tooling.client import Outcome, SearchOutcome
from pokedex_tooling.entities import EntityKind, EntityRef

DESCRIBED_RESULTS = 15


def describe(outcome: SearchOutcome) -> str:
    """Summarize an outcome for failure messages."""
    head = ", ".join(str(result.ref) for result in outcome.results[:DESCRIBED_RESULTS])
    more = len(outcome.results) - DESCRIBED_RESULTS
    suffix = f", and {more} more" if more > 0 else ""
    return f"query {outcome.query!r} gave {outcome.outcome} [{head}{suffix}]"


def _require(condition: bool, message: str, outcome: SearchOutcome) -> None:
    if not condition:
        raise AssertionError(f"{message}; {describe(outcome)}")


def rank_within_kind(outcome: SearchOutcome, ref: EntityRef) -> int | None:
    """Return the 1-based position of an entity among results of its kind, if present."""
    for position, result in enumerate(outcome.of_kind(ref.kind), start=1):
        if result.ref == ref:
            return position
    return None


def assert_outcome(outcome: SearchOutcome, expected: Outcome) -> None:
    """Assert the outcome of the search."""
    _require(outcome.outcome == expected, f"Expected outcome {expected}", outcome)


def assert_first(outcome: SearchOutcome, ref: EntityRef) -> None:
    """Assert which entity is the first result overall."""
    _require(
        bool(outcome.results) and outcome.results[0].ref == ref, f"Expected {ref} first", outcome
    )


def assert_within_first_of_kind(outcome: SearchOutcome, ref: EntityRef, k: int) -> None:
    """Assert that an entity is within the first k results of its kind."""
    position = rank_within_kind(outcome, ref)
    _require(position is not None, f"Expected {ref} in the results", outcome)
    _require(
        position is not None and position <= k,
        f"Expected {ref} within the first {k} {ref.kind} results, found at {position}",
        outcome,
    )


def assert_includes(outcome: SearchOutcome, refs: Sequence[EntityRef]) -> None:
    """Assert that every entity appears in the results."""
    present = {result.ref for result in outcome.results}
    missing = [str(ref) for ref in refs if ref not in present]
    _require(not missing, f"Missing {missing}", outcome)


def assert_excludes(outcome: SearchOutcome, refs: Sequence[EntityRef]) -> None:
    """Assert that no entity appears in the results."""
    present = {result.ref for result in outcome.results}
    unexpected = [str(ref) for ref in refs if ref in present]
    _require(not unexpected, f"Unexpected {unexpected}", outcome)


def assert_ranks_before(outcome: SearchOutcome, first: EntityRef, second: EntityRef) -> None:
    """Assert that the first entity appears and, if the second appears, ranks before it.

    Entities of the same kind are compared within their kind; otherwise the
    overall rank is compared.
    """
    if first.kind == second.kind:
        first_position = rank_within_kind(outcome, first)
        second_position = rank_within_kind(outcome, second)
    else:
        overall = {result.ref: result.rank for result in outcome.results}
        first_position = overall.get(first)
        second_position = overall.get(second)
    _require(first_position is not None, f"Expected {first} in the results", outcome)
    _require(
        first_position is None or second_position is None or first_position < second_position,
        f"Expected {first} before {second}, found at {first_position} and {second_position}",
        outcome,
    )


def assert_in_order(outcome: SearchOutcome, refs: Sequence[EntityRef]) -> None:
    """Assert that every entity appears, in this relative order within its kind."""
    assert_includes(outcome, refs)
    for kind in EntityKind:
        expected = [ref for ref in refs if ref.kind == kind]
        actual = [result.ref for result in outcome.of_kind(kind) if result.ref in expected]
        _require(
            actual == expected,
            f"Expected {kind} order {[str(ref) for ref in expected]}, got "
            f"{[str(ref) for ref in actual]}",
            outcome,
        )


def assert_every_pokemon_has_type(outcome: SearchOutcome, type_name: str) -> None:
    """Assert that every Pokémon result has the given type."""
    offenders = [
        str(result.ref)
        for result in outcome.of_kind(EntityKind.POKEMON)
        if type_name not in result.types
    ]
    _require(not offenders, f"Pokémon without type {type_name}: {offenders}", outcome)


def assert_has_explanation(outcome: SearchOutcome) -> None:
    """Assert that the response explains its outcome."""
    _require(
        outcome.explanation is not None and bool(outcome.explanation.strip()),
        "Expected an explanation",
        outcome,
    )
