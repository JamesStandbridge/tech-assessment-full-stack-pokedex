# 6. Build the API with FastAPI and the interface with React

- Status: accepted
- Date: 2026-09-29

## Context and problem statement

The contract in `specs/api/openapi.yaml` is written first; the backend and the
frontend must conform to it. The specification tooling is already Python. The
interface relies on animated, adaptive views and a relation graph.

## Considered options

1. Python with FastAPI and Pydantic for the API; TypeScript with React and Vite
   for the interface.
2. TypeScript end to end, with Fastify or NestJS for the API.
3. Next.js serving both the interface and the API.

## Decision outcome

Option 1.

- The API shares Python, Pydantic and the test tooling with the specification
  harness, and FastAPI validates input from typed models.
- The interface is a single-page React application built with Vite, since the
  API is separate and nothing needs server rendering.
- Frontend types are generated from `openapi.yaml` with `openapi-typescript`,
  so the contract is the single source of truth on both sides.
- TanStack Query handles request state and cancellation, Framer Motion the
  animations, and `d3-force` the relation graph.

## Consequences

- Two languages in the repository, each on its natural side.
- FastAPI generates its own OpenAPI document; conformance to the written
  contract is enforced by the acceptance suite, which validates every response
  against `openapi.yaml`.
- Option 2 would share one language but duplicate the Python tooling. Option 3
  would couple the API to the frontend deployment and add server rendering the
  product does not need.
