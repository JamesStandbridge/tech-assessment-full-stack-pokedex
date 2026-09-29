"""HTTP client that runs searches against the API and checks the contract."""

import json
from enum import StrEnum
from typing import Literal

import httpx
from pydantic import BaseModel, ConfigDict

from pokedex_tooling.contract import ContractValidator, ContractViolationError
from pokedex_tooling.entities import EntityKind, EntityRef

API_URL_VARIABLE = "POKEDEX_API_URL"
DEFAULT_API_URL = "http://127.0.0.1:8000"
DEFAULT_TIMEOUT_SECONDS = 10.0
MAX_PAGES_PER_SECTION = 100


class Outcome(StrEnum):
    """Outcome of a search, including rejection of invalid input."""

    RESULTS = "results"
    EMPTY = "empty"
    INVALID = "invalid"


class RankedResult(BaseModel):
    """The fields of a result that specifications assert on."""

    ref: EntityRef
    rank: int
    types: list[str]


class Term(BaseModel):
    """A query term and the role it was recognized in."""

    model_config = ConfigDict(extra="ignore")

    text: str
    role: str
    value: str | None


class Notice(BaseModel):
    """A caveat attached to a response."""

    model_config = ConfigDict(extra="ignore")

    code: str
    message: str


class SearchOutcome(BaseModel):
    """What a search returned, with every page of every section collected.

    Results are ordered by section, then by rank within the section.
    """

    query: str
    outcome: Outcome
    explanation: str | None
    results: list[RankedResult]
    canonical_query: str | None = None
    terms: list[Term] = []
    notices: list[Notice] = []
    best_match: EntityRef | None = None

    def of_kind(self, kind: EntityKind) -> list[RankedResult]:
        """Return the results of one kind, in rank order."""
        return [result for result in self.results if result.ref.kind == kind]


class SearchApiUnavailableError(Exception):
    """Raised when the search API cannot be reached or is not ready."""


class _WireResult(BaseModel):
    model_config = ConfigDict(extra="ignore")

    kind: EntityKind
    name: str
    rank: int
    types: list[str] = []


class _WireSection(BaseModel):
    model_config = ConfigDict(extra="ignore")

    kind: EntityKind
    total: int
    results: list[_WireResult]
    next_cursor: str | None


class _WireEntityRef(BaseModel):
    model_config = ConfigDict(extra="ignore")

    kind: EntityKind
    name: str


class _WireResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    canonical_query: str | None
    outcome: Literal["results", "empty"]
    explanation: str | None
    terms: list[Term]
    notices: list[Notice]
    best_match: _WireEntityRef | None
    sections: list[_WireSection]


class SearchClient:
    """Runs searches over HTTP and validates every response against the contract."""

    def __init__(
        self,
        base_url: str,
        contract: ContractValidator,
        timeout_seconds: float = DEFAULT_TIMEOUT_SECONDS,
        transport: httpx.BaseTransport | None = None,
    ) -> None:
        """Create a client.

        Args:
            base_url: Root URL of the search API.
            contract: Validator for response payloads.
            timeout_seconds: Timeout applied to every request.
            transport: HTTP transport override, used to test the client itself.
        """
        self._base_url = base_url
        self._contract = contract
        self._http = httpx.Client(base_url=base_url, timeout=timeout_seconds, transport=transport)

    def close(self) -> None:
        """Release the underlying connections."""
        self._http.close()

    def ensure_available(self) -> None:
        """Check that the API answers its health endpoint.

        Raises:
            SearchApiUnavailableError: If the API is unreachable or not ready.
        """
        try:
            response = self._http.get("/api/health")
        except httpx.TransportError as error:
            raise SearchApiUnavailableError(
                f"The search API is not reachable at {self._base_url}. Start it, or set "
                f"{API_URL_VARIABLE}. Cause: {error}"
            ) from error
        if response.status_code != httpx.codes.OK:
            raise SearchApiUnavailableError(
                f"The search API at {self._base_url} is not ready: HTTP {response.status_code}."
            )

    def search(self, query: str) -> SearchOutcome:
        """Run one search and collect every page of every section.

        Args:
            query: Raw query text, sent unchanged.

        Returns:
            The outcome, the interpretation and the complete ranked results.

        Raises:
            ContractViolationError: If a response breaks the contract.
        """
        first = self._fetch(query, {})
        if first is None:
            return SearchOutcome(query=query, outcome=Outcome.INVALID, explanation=None, results=[])
        results: list[RankedResult] = []
        for section in first.sections:
            results.extend(self._collect_section(query, section))
        return SearchOutcome(
            query=query,
            outcome=Outcome(first.outcome),
            explanation=first.explanation,
            results=results,
            canonical_query=first.canonical_query,
            terms=first.terms,
            notices=first.notices,
            best_match=EntityRef(kind=first.best_match.kind, name=first.best_match.name)
            if first.best_match
            else None,
        )

    def _collect_section(self, query: str, first_page: _WireSection) -> list[RankedResult]:
        section = first_page
        items = list(section.results)
        pages = 1
        while section.next_cursor is not None:
            pages += 1
            if pages > MAX_PAGES_PER_SECTION:
                raise ContractViolationError(
                    f"The {first_page.kind} section of {query!r} exceeds {MAX_PAGES_PER_SECTION} "
                    "pages."
                )
            page = self._fetch(query, {"kind": section.kind.value, "cursor": section.next_cursor})
            if page is None or [s.kind for s in page.sections] != [first_page.kind]:
                raise ContractViolationError(
                    f"A {first_page.kind} cursor for {query!r} must return that section only."
                )
            section = page.sections[0]
            if section.total != first_page.total:
                raise ContractViolationError(
                    f"The {first_page.kind} total for {query!r} changed between pages."
                )
            items.extend(section.results)
        ranks = [item.rank for item in items]
        if ranks != list(range(1, len(items) + 1)):
            raise ContractViolationError(
                f"Ranks of the {first_page.kind} section for {query!r} must run from 1 without "
                f"gaps or duplicates across pages, got {ranks}."
            )
        if len(items) != first_page.total:
            raise ContractViolationError(
                f"The {first_page.kind} section for {query!r} announced {first_page.total} "
                f"results but returned {len(items)}."
            )
        if any(item.kind != first_page.kind for item in items):
            raise ContractViolationError(
                f"The {first_page.kind} section for {query!r} holds results of another kind."
            )
        return [
            RankedResult(
                ref=EntityRef(kind=item.kind, name=item.name), rank=item.rank, types=item.types
            )
            for item in items
        ]

    def _fetch(self, query: str, parameters: dict[str, str]) -> _WireResponse | None:
        response = self._http.get("/api/search", params={"q": query, **parameters})
        payload = self._decode(response)
        if response.status_code == httpx.codes.BAD_REQUEST:
            self._contract.validate(payload, "ErrorResponse")
            return None
        if response.status_code != httpx.codes.OK:
            raise ContractViolationError(
                f"Unexpected HTTP {response.status_code} for query {query!r}: {response.text[:300]}"
            )
        self._contract.validate(payload, "SearchResponse")
        return _WireResponse.model_validate(payload)

    @staticmethod
    def _decode(response: httpx.Response) -> object:
        try:
            payload: object = response.json()
        except json.JSONDecodeError as error:
            raise ContractViolationError(
                f"Response is not JSON (HTTP {response.status_code}): {response.text[:300]}"
            ) from error
        return payload
