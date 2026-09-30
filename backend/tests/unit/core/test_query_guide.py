"""Every query the guide publishes is read as the guide claims."""

from pathlib import Path

import pytest
from pydantic import BaseModel, ConfigDict, JsonValue

from pokedex_search.core.query.parser import VocabularyQueryParser
from pokedex_search.domain.query import ValidQuery

_GUIDE = Path(__file__).resolve().parents[4] / "frontend/src/features/search/guide/guide.json"


class GuideTerm(BaseModel):
    """One term the parser reports for a published query."""

    model_config = ConfigDict(extra="forbid")

    text: str
    role: str


class GuideCheck(BaseModel):
    """The reading a published query must keep."""

    model_config = ConfigDict(extra="forbid")

    plan: dict[str, JsonValue]
    terms: list[GuideTerm]


class GuideExample(BaseModel):
    """An example button in one section of the guide."""

    model_config = ConfigDict(extra="forbid")

    query: str
    label: str


class GuideMiss(BaseModel):
    """A query the guide tells the user not to ask, and what to say instead."""

    model_config = ConfigDict(extra="forbid")

    query: str
    reason: str
    say: str


class GuideSection(BaseModel):
    """One of the four readings the guide teaches."""

    model_config = ConfigDict(extra="forbid")

    id: str
    title: str
    lead: str
    pattern: str
    examples: list[GuideExample]
    misses: list[GuideMiss]


class GuideTip(BaseModel):
    """A tip whose example query is checked with the others."""

    model_config = ConfigDict(extra="forbid")

    text: str
    query: str


class QueryGuideFile(BaseModel):
    """The guide content the interface renders."""

    model_config = ConfigDict(extra="forbid")

    checks: dict[str, GuideCheck]
    sections: list[GuideSection]
    tips: list[GuideTip]


def _guide() -> QueryGuideFile:
    return QueryGuideFile.model_validate_json(_GUIDE.read_text(encoding="utf-8"))


def _published(guide: QueryGuideFile) -> set[str]:
    queries = {tip.query for tip in guide.tips}
    for section in guide.sections:
        queries.update(example.query for example in section.examples)
        for miss in section.misses:
            queries.add(miss.query)
            queries.add(miss.say)
    return queries


def _section(plan: dict[str, JsonValue]) -> str:
    reading = "name"
    if plan.get("types") or plan.get("damage_classes"):
        reading = "criteria"
    if plan.get("relation") is not None:
        reading = "strategy"
    if plan.get("stat_sort") or plan.get("stat_filters"):
        reading = "criteria"
    if plan.get("effect") is not None:
        reading = "effect"
    if plan.get("weather") is not None:
        reading = "strategy"
    if plan.get("name") is not None or plan.get("dex_number") is not None:
        reading = "name"
    return reading


def _assert_reading(parser: VocabularyQueryParser, query: str, check: GuideCheck) -> None:
    interpretation = parser.parse(ValidQuery(text=query))
    assert len(interpretation.alternatives) == 1
    actual = interpretation.alternatives[0].model_dump(mode="json", exclude_defaults=True)
    assert actual == check.plan
    terms = [{"text": term.text, "role": term.role.value} for term in interpretation.terms]
    assert terms == [item.model_dump() for item in check.terms]


def test_every_published_query_is_checked() -> None:
    guide = _guide()
    assert _published(guide) == set(guide.checks)


def test_each_example_sits_in_the_section_its_reading_names() -> None:
    guide = _guide()
    for section in guide.sections:
        for example in section.examples:
            assert _section(guide.checks[example.query].plan) == section.id


@pytest.mark.parametrize("query", _guide().checks.keys(), ids=list(_guide().checks.keys()))
def test_every_guide_query_reads_as_published(parser: VocabularyQueryParser, query: str) -> None:
    _assert_reading(parser, query, _guide().checks[query])
