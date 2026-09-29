"""Match the longest known phrases in a query."""

from collections.abc import Iterable, Sequence

from pokedex_search.core.query.concepts import Concept, Span
from pokedex_search.core.query.tokenizer import Token, tokenize
from pokedex_search.core.query.vocabulary import Vocabulary
from pokedex_search.domain.entities import EntityRef, Frozen
from pokedex_search.domain.terms import TermRole

MAX_NUMBER_LENGTH = 4
DESCRIPTION_PREFIX = "description:"


class PhraseTable(Frozen):
    """Phrases, as tuples of folded words, and their meanings in precedence order."""

    entries: dict[tuple[str, ...], tuple[Concept, ...]]
    longest: int

    def meanings(self, words: tuple[str, ...]) -> tuple[Concept, ...]:
        """Return the meanings of a phrase, or none when it is unknown."""
        return self.entries.get(words, ())


def _words(phrase: str) -> tuple[str, ...]:
    return tuple(token.word for token in tokenize(phrase))


def _vocabulary_concepts(vocabulary: Vocabulary) -> Iterable[tuple[str, Concept]]:
    for kind, phrases in vocabulary.kinds.items():
        yield from ((phrase, Concept(role=TermRole.KIND, value=kind)) for phrase in phrases)
    yield from ((name, Concept(role=TermRole.TYPE, value=name)) for name in vocabulary.types)
    for stat, phrases in vocabulary.stats.items():
        yield from ((phrase, Concept(role=TermRole.STAT, value=stat)) for phrase in phrases)
    for adjective in vocabulary.stat_adjectives:
        value = f"{adjective.stat}:{adjective.direction}"
        move_value = f"{adjective.move_stat}:{adjective.direction}" if adjective.move_stat else None
        for phrase in adjective.phrases:
            yield phrase, Concept(role=TermRole.STAT, value=value, move_value=move_value)
        for phrase in adjective.comparatives:
            concept = Concept(
                role=TermRole.STAT, value=value, move_value=move_value, comparative=True
            )
            yield phrase, concept
    yield from _grouped(vocabulary.directions.items(), TermRole.DIRECTION)
    yield from _grouped(vocabulary.comparators.items(), TermRole.COMPARATOR)
    yield from _characteristics(vocabulary)
    yield from _grouped(vocabulary.damage_classes.items(), TermRole.CHARACTERISTIC, "damage-class:")
    yield from _grouped(vocabulary.effects.items(), TermRole.EFFECT)
    yield from _grouped(vocabulary.modes.items(), TermRole.MODE)
    yield from _grouped(vocabulary.targets.items(), TermRole.TARGET)
    yield from _grouped(vocabulary.weathers.items(), TermRole.WEATHER)
    yield from _grouped(vocabulary.relations.items(), TermRole.RELATION)
    yield from ((word, Concept(role=TermRole.FILLER, value=word)) for word in vocabulary.fillers)


def _grouped(
    groups: Iterable[tuple[str, Sequence[str]]], role: TermRole, prefix: str = ""
) -> Iterable[tuple[str, Concept]]:
    for value, phrases in groups:
        yield from ((phrase, Concept(role=role, value=f"{prefix}{value}")) for phrase in phrases)


def _characteristics(vocabulary: Vocabulary) -> Iterable[tuple[str, Concept]]:
    yield from _grouped(vocabulary.colors.items(), TermRole.CHARACTERISTIC, "color:")
    yield from _grouped(vocabulary.habitats.items(), TermRole.CHARACTERISTIC, "habitat:")
    legendary = Concept(role=TermRole.CHARACTERISTIC, value="legendary:true")
    mythical = Concept(role=TermRole.CHARACTERISTIC, value="mythical:true")
    yield from ((phrase, legendary) for phrase in vocabulary.legendary)
    yield from ((phrase, mythical) for phrase in vocabulary.mythical)


def build_phrase_table(
    vocabulary: Vocabulary,
    names: Iterable[EntityRef],
    genus_words: Iterable[str],
    description_words: Iterable[str] = (),
) -> PhraseTable:
    """Index every phrase: vocabulary, then entity names, genus words and description words.

    Args:
        vocabulary: The curated vocabulary.
        names: Every entity of the dataset.
        genus_words: Words of species genera, which name characteristics.
        description_words: Words of species descriptions, the weakest meaning.

    Returns:
        The phrase table.
    """
    entries: dict[tuple[str, ...], list[Concept]] = {}
    for phrase, concept in _vocabulary_concepts(vocabulary):
        entries.setdefault(_words(phrase), []).append(concept)
    for ref in names:
        concept = Concept(role=TermRole.NAME, value=ref.name, entity=ref)
        entries.setdefault(tuple(ref.name.split("-")), []).append(concept)
    for word in genus_words:
        concept = Concept(role=TermRole.CHARACTERISTIC, value=f"genus:{word}")
        entries.setdefault((word,), []).append(concept)
    for word in description_words:
        concept = Concept(role=TermRole.CHARACTERISTIC, value=f"{DESCRIPTION_PREFIX}{word}")
        entries.setdefault((word,), []).append(concept)
    longest = max(len(words) for words in entries)
    return PhraseTable(
        entries={words: tuple(concepts) for words, concepts in entries.items()}, longest=longest
    )


def _number(token: Token) -> tuple[Concept, ...]:
    digits = token.word.removeprefix("#")
    if not digits.isdigit() or len(digits) > MAX_NUMBER_LENGTH:
        return ()
    role = TermRole.DEX_NUMBER if token.word.startswith("#") else TermRole.NUMBER
    return (Concept(role=role, value=str(int(digits))),)


def match_spans(tokens: Sequence[Token], table: PhraseTable) -> tuple[Span, ...]:
    """Read tokens left to right, taking the longest known phrase at each position.

    Args:
        tokens: Tokens of the query.
        table: Known phrases.

    Returns:
        Spans covering every token; unknown tokens form spans without meaning.
    """
    spans: list[Span] = []
    position = 0
    while position < len(tokens):
        span = _longest_at(tokens, table, position)
        spans.append(span)
        position = span.end
    return tuple(spans)


def _longest_at(tokens: Sequence[Token], table: PhraseTable, start: int) -> Span:
    for length in range(min(table.longest, len(tokens) - start), 0, -1):
        words = tuple(token.word for token in tokens[start : start + length])
        concepts = table.meanings(words)
        if concepts:
            return Span(start=start, end=start + length, concepts=concepts)
    return Span(start=start, end=start + 1, concepts=_number(tokens[start]))
