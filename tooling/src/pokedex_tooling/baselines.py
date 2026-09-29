"""A naive full-text ranker, used to calibrate thresholds and to pool candidates."""

import re

from pokedex_tooling.entities import EntityKind
from pokedex_tooling.snapshot import AbilityRecord, MoveRecord, PokemonRecord, Snapshot

MIN_TOKEN_LENGTH = 3


def _searchable_text(record: PokemonRecord | MoveRecord | AbilityRecord) -> str:
    fields = [record.name.replace("-", " ")]
    if isinstance(record, PokemonRecord):
        fields += [record.species.description or "", " ".join(record.types)]
    else:
        fields += [record.short_effect or "", record.effect or ""]
    return " ".join(fields).lower()


def naive_full_text(snapshot: Snapshot, query: str, kind: EntityKind) -> list[str]:
    """Rank entities of one kind by how many query tokens their text contains.

    Tokens of at least three letters are matched as substrings of the name,
    effects or species description, the way a first full-text search would.

    Args:
        snapshot: The dataset.
        query: Raw query text.
        kind: Kind of entity to rank.

    Returns:
        Names of matching entities, most matching tokens first, then by id.
    """
    tokens = [
        token for token in re.findall(r"[a-z]+", query.lower()) if len(token) >= MIN_TOKEN_LENGTH
    ]
    scored: list[tuple[int, int, str]] = []
    for record in snapshot.records(kind):
        text = _searchable_text(record)
        score = sum(token in text for token in tokens)
        if score:
            scored.append((-score, record.id, record.name))
    return [name for _, _, name in sorted(scored)]
