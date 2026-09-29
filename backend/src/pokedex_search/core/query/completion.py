"""Complete a partial query with vocabulary concepts."""

from collections.abc import Iterable

from pokedex_search.core.query.normalizer import fold
from pokedex_search.core.query.vocabulary import Vocabulary
from pokedex_search.domain.suggestions import TypingSuggestion, TypingSuggestionKind
from pokedex_search.domain.terms import TermRole


def _concepts(vocabulary: Vocabulary) -> Iterable[tuple[TermRole, str, str]]:
    for kind, phrases in vocabulary.kinds.items():
        yield TermRole.KIND, kind, phrases[0]
    for type_name in vocabulary.types:
        yield TermRole.TYPE, type_name, type_name
    for stat, phrases in vocabulary.stats.items():
        yield TermRole.STAT, stat, phrases[0]
    for effect, phrases in vocabulary.effects.items():
        yield TermRole.EFFECT, effect, phrases[0]
    for weather, phrases in vocabulary.weathers.items():
        yield TermRole.WEATHER, weather, phrases[0]
    for color, phrases in vocabulary.colors.items():
        yield TermRole.CHARACTERISTIC, f"color:{color}", phrases[0]
    for habitat, phrases in vocabulary.habitats.items():
        yield TermRole.CHARACTERISTIC, f"habitat:{habitat}", phrases[0]
    yield TermRole.CHARACTERISTIC, "legendary:true", vocabulary.legendary[0]
    yield TermRole.CHARACTERISTIC, "mythical:true", vocabulary.mythical[0]


class ConceptCompleter:
    """Suggests the concepts whose canonical phrase starts with the last typed word."""

    def __init__(self, vocabulary: Vocabulary) -> None:
        """Index the canonical phrase of every concept.

        Args:
            vocabulary: Every word the search understands.
        """
        self._concepts = tuple(_concepts(vocabulary))

    def complete(self, partial: str, limit: int) -> tuple[TypingSuggestion, ...]:
        """Return concepts that complete the last word of a partial query.

        Args:
            partial: The query typed so far.
            limit: Maximum number of suggestions.

        Returns:
            Concept suggestions, each with the query that uses it.
        """
        words = fold(partial).split()
        if not words:
            return ()
        head, last = " ".join(words[:-1]), words[-1]
        found = [
            TypingSuggestion(
                kind=TypingSuggestionKind.CONCEPT,
                label=f"{phrase} ({role})",
                query=f"{head} {phrase}".strip(),
                concept_role=role,
                concept_value=value,
            )
            for role, value, phrase in self._concepts
            if phrase.startswith(last) and phrase != last
        ]
        return tuple(found[:limit])
