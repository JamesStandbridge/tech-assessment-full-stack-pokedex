from pytest_bdd import parsers, scenarios, then, when

from pokedex_tooling import vocabulary
from pokedex_tooling.assertions import (
    assert_best_match,
    assert_every_pokemon_has_type,
    assert_excludes,
    assert_first,
    assert_has_explanation,
    assert_in_order,
    assert_includes,
    assert_notice,
    assert_outcome,
    assert_ranks_before,
    assert_term_role,
    assert_within_first_of_kind,
)
from pokedex_tooling.client import Outcome, SearchClient, SearchOutcome
from pokedex_tooling.entities import EntityRef
from pokedex_tooling.paths import FEATURES_DIR

scenarios(str(FEATURES_DIR))


def refs_from(datatable: list[list[str]]) -> list[EntityRef]:
    header, *rows = datatable
    assert header == [vocabulary.TABLE_HEADER], f"Unexpected table header {header}"
    return [EntityRef.parse(row[0]) for row in rows]


@when(parsers.re(vocabulary.SEARCH), target_fixture="search_outcome")
def search_for(search_client: SearchClient, query: str) -> SearchOutcome:
    return search_client.search(query)


@then(parsers.re(vocabulary.OUTCOME))
def outcome_is(search_outcome: SearchOutcome, outcome: str) -> None:
    assert_outcome(search_outcome, Outcome(outcome))


@then(parsers.re(vocabulary.FIRST_RESULT))
def first_result_is(search_outcome: SearchOutcome, ref: str) -> None:
    assert_first(search_outcome, EntityRef.parse(ref))


@then(parsers.re(vocabulary.WITHIN_FIRST_OF_KIND), converters={"k": int})
def within_first_of_kind(search_outcome: SearchOutcome, ref: str, k: int) -> None:
    assert_within_first_of_kind(search_outcome, EntityRef.parse(ref), k)


@then(parsers.re(vocabulary.RESULTS_INCLUDE))
def results_include(search_outcome: SearchOutcome, datatable: list[list[str]]) -> None:
    assert_includes(search_outcome, refs_from(datatable))


@then(parsers.re(vocabulary.RESULTS_EXCLUDE))
def results_exclude(search_outcome: SearchOutcome, datatable: list[list[str]]) -> None:
    assert_excludes(search_outcome, refs_from(datatable))


@then(parsers.re(vocabulary.RANKS_BEFORE))
def ranks_before(search_outcome: SearchOutcome, first: str, second: str) -> None:
    assert_ranks_before(search_outcome, EntityRef.parse(first), EntityRef.parse(second))


@then(parsers.re(vocabulary.RESULTS_IN_ORDER))
def results_in_order(search_outcome: SearchOutcome, datatable: list[list[str]]) -> None:
    assert_in_order(search_outcome, refs_from(datatable))


@then(parsers.re(vocabulary.EVERY_POKEMON_HAS_TYPE))
def every_pokemon_has_type(search_outcome: SearchOutcome, type_name: str) -> None:
    assert_every_pokemon_has_type(search_outcome, type_name)


@then(parsers.re(vocabulary.HAS_EXPLANATION))
def has_explanation(search_outcome: SearchOutcome) -> None:
    assert_has_explanation(search_outcome)


@then(parsers.re(vocabulary.TERM_ROLE))
def term_is_recognized(search_outcome: SearchOutcome, term: str, role: str) -> None:
    assert_term_role(search_outcome, term, role)


@then(parsers.re(vocabulary.TERM_IGNORED))
def term_is_ignored(search_outcome: SearchOutcome, term: str) -> None:
    assert_term_role(search_outcome, term, vocabulary.IGNORED_ROLE)


@then(parsers.re(vocabulary.IGNORED_TERMS_NOTICE))
def ignored_terms_are_noted(search_outcome: SearchOutcome) -> None:
    assert_notice(search_outcome, vocabulary.IGNORED_TERMS_NOTICE_CODE)


@then(parsers.re(vocabulary.BEST_MATCH))
def best_match_is(search_outcome: SearchOutcome, ref: str) -> None:
    assert_best_match(search_outcome, EntityRef.parse(ref))


@then(parsers.re(vocabulary.NO_BEST_MATCH))
def no_best_match(search_outcome: SearchOutcome) -> None:
    assert_best_match(search_outcome, None)
