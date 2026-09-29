"""Words of species genera, which queries use to describe a Pokémon."""

from collections.abc import Iterable

from pokedex_search.core.query.tokenizer import tokenize
from pokedex_search.domain.entities import Pokemon

_GENUS_SUFFIX = "pokemon"


def genus_words(pokemon: Iterable[Pokemon]) -> frozenset[str]:
    """Collect the folded words of every genus, without the trailing Pokémon.

    Args:
        pokemon: Every Pokémon of the dataset.

    Returns:
        Words such as fox, mouse or seed.
    """
    return frozenset(
        token.word
        for entry in pokemon
        for token in tokenize(entry.species.genus or "")
        if token.word != _GENUS_SUFFIX
    )
