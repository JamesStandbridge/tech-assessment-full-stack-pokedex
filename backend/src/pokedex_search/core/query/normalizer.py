"""Fold text for comparison: case, accents, apostrophes and punctuation."""

import re
import unicodedata

_APOSTROPHES = str.maketrans({"\u2019": "'", "\u2018": "'", "`": "'", "\u00ad": None})
_NON_ALPHANUMERIC = re.compile(r"[^a-z0-9]")


def fold(text: str) -> str:
    """Lowercase text and strip accents, keeping every other character.

    Args:
        text: Text as typed.

    Returns:
        The folded text.
    """
    decomposed = unicodedata.normalize("NFKD", text.translate(_APOSTROPHES))
    return "".join(char for char in decomposed if not unicodedata.combining(char)).casefold()


def fold_word(word: str) -> str:
    """Fold a single word and drop the apostrophes inside it, as in farfetch'd."""
    return fold(word).replace("'", "")


def name_key(text: str) -> str:
    """Reduce a name to letters and digits, so that Mr. Mime matches mr-mime."""
    return _NON_ALPHANUMERIC.sub("", fold(text))
