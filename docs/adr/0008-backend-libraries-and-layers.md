# 8. Build the backend in strict layers on a small set of libraries

- Status: accepted
- Date: 2026-09-29

## Context and problem statement

The search runs over 429 entities, so raw speed is not the constraint:
correctness of the rules is. The code must still show how it would scale, keep
each layer testable in isolation, and stay readable as the rules grow.

## Considered options

1. A backend written in Rust.
2. GPU acceleration with CUDA, for vector search or model inference.
3. Python with a few native-backed libraries, in explicit layers.

## Decision outcome

Option 3.

Layers, enforced by `import-linter` contracts in `backend/pyproject.toml`:

| Layer | Content | May import |
|---|---|---|
| `domain` | Entities, facts, plans, results, errors | Standard library, Pydantic |
| `core` | Pure algorithms: query understanding, enrichment, scoring | `domain`, RapidFuzz, bm25s |
| `application` | Services, ports, plan evaluation, pagination | `core`, `domain` |
| `infrastructure` | Settings, dataset loader, resources, in-memory index, cursor codec | inner layers |
| `api` | FastAPI routes, DTOs, mappers, error handlers | `application`, `domain` |
| `bootstrap` | Composition root, the only place concrete classes are built | everything |

Libraries:

| Need | Library |
|---|---|
| HTTP API | FastAPI, Uvicorn |
| Models and validation | Pydantic v2, whose core is written in Rust |
| Bounded typo matching | RapidFuzz, written in C++, exact Damerau-Levenshtein |
| Description fallback | bm25s |
| Text normalization, rules | Standard library `unicodedata` and `re`, with versioned YAML resources |

Quality gates: mypy strict, Ruff with pylint and complexity rules, modules of at
most 200 lines and functions of at most 40 lines checked by an architecture
test, and typed fakes instead of mocks for every port.

## Consequences

- Rust already works where it matters, inside Pydantic, without a second
  toolchain for reviewers.
- CUDA is rejected: embeddings were rejected for correctness in ADR 4, a GPU
  gives nothing on 429 documents, and it would stop reviewers without an NVIDIA
  card from running the project.
- The in-memory index is the first adapter of the ports. The next one is
  Tantivy through `tantivy-py`: an embedded engine written in Rust, with BM25,
  fuzzy queries, fast fields for filters and sorts, and facets, which serves
  millions of documents on one machine before a search cluster is needed.
