"""Step vocabulary shared by the Gherkin step definitions and the specification checks."""

MIN_QUERY_LENGTH = 2
MAX_QUERY_LENGTH = 200

SEARCH = r'I search for "(?P<query>.*)"'
OUTCOME = r'the outcome is "(?P<outcome>results|empty|invalid)"'
FIRST_RESULT = r'the first result is "(?P<ref>[^"]+)"'
WITHIN_FIRST_OF_KIND = r'"(?P<ref>[^"]+)" is within the first (?P<k>\d+) results of its kind'
RESULTS_INCLUDE = r"the results include:"
RESULTS_EXCLUDE = r"the results exclude:"
RANKS_BEFORE = r'"(?P<first>[^"]+)" ranks before "(?P<second>[^"]+)"'
RESULTS_IN_ORDER = r"these results appear in this order:"
EVERY_POKEMON_HAS_TYPE = r'every pokemon result has the type "(?P<type_name>[a-z]+)"'
HAS_EXPLANATION = r"the response includes an explanation"

STEP_PATTERNS: tuple[str, ...] = (
    SEARCH,
    OUTCOME,
    FIRST_RESULT,
    WITHIN_FIRST_OF_KIND,
    RESULTS_INCLUDE,
    RESULTS_EXCLUDE,
    RANKS_BEFORE,
    RESULTS_IN_ORDER,
    EVERY_POKEMON_HAS_TYPE,
    HAS_EXPLANATION,
)
TABLE_STEPS: frozenset[str] = frozenset({RESULTS_INCLUDE, RESULTS_EXCLUDE, RESULTS_IN_ORDER})
REFERENCE_GROUPS: tuple[str, ...] = ("ref", "first", "second")
TABLE_HEADER = "result"


def is_invalid_query(query: str) -> bool:
    """Tell whether a query breaks the input rules.

    Args:
        query: Raw query text.

    Returns:
        True if the trimmed query is shorter or longer than allowed.
    """
    length = len(query.strip())
    return length < MIN_QUERY_LENGTH or length > MAX_QUERY_LENGTH
