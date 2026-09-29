"""The typing suggestion use case: entity names and vocabulary concepts."""

from pokedex_search.application.evaluation.base import ALL_KINDS
from pokedex_search.application.ports import ConceptSource, NameIndex
from pokedex_search.application.query_validator import QueryValidator
from pokedex_search.core.query.normalizer import name_key
from pokedex_search.core.ranking.names import NameTier
from pokedex_search.domain.suggestions import TypingSuggestion, TypingSuggestionKind

MAX_ENTITY_SUGGESTIONS = 5
MAX_CONCEPT_SUGGESTIONS = 3


class SuggestService:
    """Completes partial queries while the user types."""

    def __init__(
        self, validator: QueryValidator, names: NameIndex, concepts: ConceptSource
    ) -> None:
        """Keep the collaborators.

        Args:
            validator: Enforcer of the input rules.
            names: Name matching over every entity.
            concepts: Completer of vocabulary concepts.
        """
        self._validator = validator
        self._names = names
        self._concepts = concepts

    def suggest(self, partial: str) -> tuple[TypingSuggestion, ...]:
        """Return entity names that start with the query, then matching concepts.

        Args:
            partial: The query typed so far.

        Returns:
            Suggestions, best first.

        Raises:
            InvalidQueryError: If the partial query breaks the input rules.
        """
        query = self._validator.validate(partial)
        matches = [
            match
            for match in self._names.match(name_key(query.text), ALL_KINDS)
            if match.tier in (NameTier.EXACT, NameTier.PREFIX)
        ][:MAX_ENTITY_SUGGESTIONS]
        entities = tuple(
            TypingSuggestion(
                kind=TypingSuggestionKind.ENTITY,
                label=f"{match.ref.name} ({match.ref.kind})",
                query=match.ref.name.replace("-", " "),
                entity=match.ref,
            )
            for match in matches
        )
        return entities + self._concepts.complete(query.text, MAX_CONCEPT_SUGGESTIONS)
