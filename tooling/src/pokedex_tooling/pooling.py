"""Pool candidates from several rankers into a blind assessment sheet."""

import argparse
import hashlib
import sys
from collections.abc import Mapping, Sequence
from pathlib import Path

import yaml

from pokedex_tooling import baselines
from pokedex_tooling.client import (
    SearchApiUnavailableError,
    SearchClient,
    SearchOutcome,
)
from pokedex_tooling.contract import ContractValidator, ContractViolationError
from pokedex_tooling.entities import EntityKind, EntityRef
from pokedex_tooling.paths import ASSESSMENTS_PATH
from pokedex_tooling.snapshot import (
    AbilityRecord,
    MoveRecord,
    PokemonRecord,
    Snapshot,
    load_snapshot,
)
from pokedex_tooling.specs import (
    AssessedQuery,
    AssessmentsDocument,
    Candidate,
    JudgmentsDocument,
    load_judgments,
    read_yaml,
)

POOL_DEPTH = 10
INSTRUCTIONS = (
    "Grade every candidate from 0 to 3 for the query alone, as a trainer asking it "
    "would. Candidates are shuffled and come from several rankers; ignore their "
    "order. Replace each null grade with a number. To add a query of your own, "
    "append an entry with an id such as Q-USER-01, the query and an empty "
    "candidate list, then run pool-assessments again."
)
GRADES: dict[str, str] = {
    "0": "Not useful for this query.",
    "1": "Marginally useful, or useful with a caveat.",
    "2": "Useful.",
    "3": "Exactly what the query asks for.",
}


def summarize(record: PokemonRecord | MoveRecord | AbilityRecord) -> str:
    """Describe an entity neutrally, with the facts an assessor needs.

    Args:
        record: The entity to describe.

    Returns:
        A one-line description.
    """
    if isinstance(record, PokemonRecord):
        stats = record.stats
        total = (
            stats.hp
            + stats.attack
            + stats.defense
            + stats.special_attack
            + stats.special_defense
            + stats.speed
        )
        legend = " Legendary." if record.species.is_legendary else ""
        myth = " Mythical." if record.species.is_mythical else ""
        return (
            f"Pokémon #{record.id}, {'/'.join(record.types)}, {record.species.genus}, "
            f"{record.species.color}, habitat {record.species.habitat}.{legend}{myth} "
            f"HP {stats.hp}, Atk {stats.attack}, Def {stats.defense}, "
            f"SpA {stats.special_attack}, SpD {stats.special_defense}, Spe {stats.speed}, "
            f"total {total}. Abilities: {', '.join(record.abilities)}."
        )
    if isinstance(record, MoveRecord):
        return (
            f"Move, {record.type}, {record.damage_class}, power {record.power}, "
            f"accuracy {record.accuracy}, effect chance {record.effect_chance}, "
            f"priority {record.priority}. {record.short_effect}"
        )
    return f"Ability. {record.short_effect}"


def shuffle_key(query_id: str, ref: EntityRef) -> str:
    """Return a stable pseudo-random sort key that hides the source ranker."""
    return hashlib.sha256(f"{query_id}|{ref}".encode()).hexdigest()


def pool_refs(
    snapshot: Snapshot,
    query: str,
    kinds: Sequence[EntityKind],
    rule_refs: Sequence[EntityRef],
    live: SearchOutcome | None,
) -> set[EntityRef]:
    """Gather the candidates of every ranker for one query.

    Args:
        snapshot: The dataset.
        query: Query text.
        kinds: Kinds to pool.
        rule_refs: Entities graded by the rule judgments.
        live: Outcome of the live search service, if available.

    Returns:
        The union of the rule entities and the top results of each ranker.
    """
    refs = {ref for ref in rule_refs if ref.kind in kinds}
    for kind in kinds:
        refs.update(
            EntityRef(kind=kind, name=name)
            for name in baselines.naive_full_text(snapshot, query, kind)[:POOL_DEPTH]
        )
        if live is not None:
            refs.update(result.ref for result in live.of_kind(kind)[:POOL_DEPTH])
    return refs


def build_assessments(
    snapshot: Snapshot,
    judgments: JudgmentsDocument,
    existing: AssessmentsDocument | None,
    live: Mapping[str, SearchOutcome],
) -> AssessmentsDocument:
    """Pool candidates for every judged and user query, keeping existing candidates and grades.

    Args:
        snapshot: The dataset.
        judgments: Rule judgments, which define the judged queries and kinds.
        existing: The current assessment sheet, if any.
        live: Live search outcomes by query id.

    Returns:
        The updated assessment sheet.
    """
    previous = {query.id: query for query in existing.queries} if existing else {}
    grades = {
        (query.id, candidate.ref): candidate.grade
        for query in previous.values()
        for candidate in query.candidates
    }
    queries: list[tuple[str, str, list[EntityKind], list[EntityRef]]] = [
        (
            judged.id,
            judged.query,
            list(judged.judgments),
            [
                EntityRef(kind=kind, name=name)
                for kind, graded in judged.judgments.items()
                for name in graded
            ],
        )
        for judged in judgments.queries
    ]
    judged_ids = {judged.id for judged in judgments.queries}
    queries += [
        (query.id, query.query, list(EntityKind), [])
        for query in previous.values()
        if query.id not in judged_ids
    ]
    assessed: list[AssessedQuery] = []
    for query_id, text, kinds, rule_refs in queries:
        refs = pool_refs(snapshot, text, kinds, rule_refs, live.get(query_id))
        earlier = previous.get(query_id)
        if earlier is not None:
            refs.update(EntityRef.parse(candidate.ref) for candidate in earlier.candidates)
        candidates: list[Candidate] = []
        for ref in sorted(refs, key=lambda ref: shuffle_key(query_id, ref)):
            record = snapshot.find(ref)
            if record is None:
                continue
            candidates.append(
                Candidate(
                    ref=str(ref), summary=summarize(record), grade=grades.get((query_id, str(ref)))
                )
            )
        assessed.append(AssessedQuery(id=query_id, query=text, candidates=candidates))
    return AssessmentsDocument(
        schema_version=1, instructions=INSTRUCTIONS, grades=GRADES, queries=assessed
    )


def write_assessments(document: AssessmentsDocument, path: Path = ASSESSMENTS_PATH) -> None:
    """Write the assessment sheet as YAML."""
    header = (
        "# Blind assessment sheet, generated by pool-assessments. Edit grades only;\n"
        "# rerun pool-assessments to add candidates. See docs/adr/0007.\n"
    )
    body = yaml.safe_dump(document.model_dump(), sort_keys=False, allow_unicode=True, width=100)
    path.write_text(header + body, encoding="utf-8")


def _live_outcomes(base_url: str, queries: Sequence[AssessedQuery]) -> dict[str, SearchOutcome]:
    client = SearchClient(base_url=base_url, contract=ContractValidator())
    try:
        client.ensure_available()
        return {query.id: client.search(query.query) for query in queries}
    finally:
        client.close()


def main() -> None:
    """Refresh the assessment sheet from the command line."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--base-url",
        default=None,
        help="Also pool the top results of the search API at this URL.",
    )
    arguments = parser.parse_args()
    snapshot = load_snapshot()
    judgments = load_judgments()
    existing = (
        AssessmentsDocument.model_validate(read_yaml(ASSESSMENTS_PATH))
        if ASSESSMENTS_PATH.exists()
        else None
    )
    draft = build_assessments(snapshot, judgments, existing, {})
    live: dict[str, SearchOutcome] = {}
    if arguments.base_url is not None:
        try:
            live = _live_outcomes(arguments.base_url, draft.queries)
        except (SearchApiUnavailableError, ContractViolationError) as error:
            print(error, file=sys.stderr)
            sys.exit(1)
    document = build_assessments(snapshot, judgments, existing, live) if live else draft
    write_assessments(document)
    pending = sum(
        candidate.grade is None for query in document.queries for candidate in query.candidates
    )
    total = sum(len(query.candidates) for query in document.queries)
    print(f"{ASSESSMENTS_PATH}: {total} candidates, {pending} awaiting a grade.")
