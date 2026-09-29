"""BM25 search over species descriptions, the approximate fallback of queries."""

from collections.abc import Sequence

import bm25s

from pokedex_search.core.query.tokenizer import tokenize
from pokedex_search.domain.entities import EntityRef, Pokemon


class Bm25DescriptionIndex:
    """Scores species descriptions against words with BM25."""

    def __init__(self, pokemon: Sequence[Pokemon]) -> None:
        """Index every description as folded words.

        Args:
            pokemon: Every Pokémon of the dataset.
        """
        self._refs = tuple(entry.ref for entry in pokemon)
        corpus = [
            [token.word for token in tokenize(entry.species.description or "")] or [""]
            for entry in pokemon
        ]
        self._retriever = bm25s.BM25()
        self._retriever.index(corpus, show_progress=False)

    def search(self, words: tuple[str, ...]) -> dict[EntityRef, float]:
        """Return Pokémon whose description contains any word, with their BM25 score."""
        if not words:
            return {}
        scores = self._retriever.get_scores(list(words))
        return {
            ref: float(score) for ref, score in zip(self._refs, scores, strict=True) if score > 0
        }
