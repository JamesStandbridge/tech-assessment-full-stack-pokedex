"""HTTP client that runs searches against the API and checks the contract."""

import json
from enum import StrEnum
from typing import Literal

import httpx
from pydantic import BaseModel, ConfigDict

from pokedex_tooling.contract import ContractValidator, ContractViolationError
from pokedex_tooling.entities import EntityKind, EntityRef

API_URL_VARIABLE = "POKEDEX_API_URL"
DEFAULT_API_URL = "http://localhost:8000"
DEFAULT_TIMEOUT_SECONDS = 10.0


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


class SearchOutcome(BaseModel):
    """What a search returned, reduced to what specifications assert on."""

    query: str
    outcome: Outcome
    explanation: str | None
    results: list[RankedResult]

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


class _WireResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    outcome: Literal["results", "empty"]
    explanation: str | None
    results: list[_WireResult]


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
        """Run one search.

        Args:
            query: Raw query text, sent unchanged.

        Returns:
            The outcome and ranked results.

        Raises:
            ContractViolationError: If the response breaks the contract.
        """
        response = self._http.get("/api/search", params={"q": query})
        payload = self._decode(response)
        if response.status_code == httpx.codes.BAD_REQUEST:
            self._contract.validate(payload, "ErrorResponse")
            return SearchOutcome(query=query, outcome=Outcome.INVALID, explanation=None, results=[])
        if response.status_code != httpx.codes.OK:
            raise ContractViolationError(
                f"Unexpected HTTP {response.status_code} for query {query!r}: {response.text[:300]}"
            )
        self._contract.validate(payload, "SearchResponse")
        wire = _WireResponse.model_validate(payload)
        results = sorted(
            (
                RankedResult(
                    ref=EntityRef(kind=item.kind, name=item.name), rank=item.rank, types=item.types
                )
                for item in wire.results
            ),
            key=lambda result: result.rank,
        )
        ranks = [result.rank for result in results]
        if ranks != list(range(1, len(results) + 1)):
            raise ContractViolationError(
                f"Ranks must run from 1 without gaps or duplicates, got {ranks}."
            )
        return SearchOutcome(
            query=query,
            outcome=Outcome(wire.outcome),
            explanation=wire.explanation,
            results=results,
        )

    @staticmethod
    def _decode(response: httpx.Response) -> object:
        try:
            payload: object = response.json()
        except json.JSONDecodeError as error:
            raise ContractViolationError(
                f"Response is not JSON (HTTP {response.status_code}): {response.text[:300]}"
            ) from error
        return payload
