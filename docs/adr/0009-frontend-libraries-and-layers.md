# 9. Build the interface in strict layers on the contract types

- Status: accepted
- Date: 2026-09-30

## Context and problem statement

ADR 6 chose a React single-page application built with Vite, with types
generated from `specs/api/openapi.yaml`, TanStack Query, Motion and
`d3-force`. The interface also needs an HTTP client, styling, accessible
widgets, URL state, tests and quality gates. It must stay as typed, layered and
testable as the backend, and meet the accessibility guardrails
SYS-A11Y-001 to SYS-A11Y-004.

## Considered options

1. npm or pnpm to manage packages.
2. React Aria Components or Radix UI for accessible widgets.
3. `nuqs` or TanStack Router to keep the query in the URL.
4. ESLint with Prettier, or Biome, for linting and formatting.

## Decision outcome

pnpm, React Aria Components, `nuqs`, and ESLint with Prettier.

Layers, enforced by `dependency-cruiser` rules in `frontend/.dependency-cruiser.cjs`:

| Layer | Content | May import |
|---|---|---|
| `api` | Generated contract types, typed client, error translation, the `SearchApi` port | nothing inside `src` |
| `domain` | Pure functions: reading of a response, view models, formatting | `api` types |
| `ui` | Visual primitives without knowledge of the Pokédex | nothing inside `src` |
| `features` | Hooks and components of each part of the screen | `domain`, `ui`, `api` port |
| `app` | Composition root: providers, the concrete client, the page | everything |

Libraries:

| Need | Library |
|---|---|
| Build and dev server | Vite, with a proxy of `/api` to the backend |
| Language | TypeScript, strict, with `noUncheckedIndexedAccess` |
| Contract types and client | `openapi-typescript`, `openapi-fetch` |
| Request state | TanStack Query, with `useInfiniteQuery` for section cursors |
| URL state | `nuqs` |
| Styling | Tailwind CSS v4, design tokens as CSS variables |
| Accessible widgets | React Aria Components |
| Animation | CSS transitions and keyframes, off under `prefers-reduced-motion` |
| Constellation | three.js `WebGPURenderer` and TSL in a module worker, still SVG map as fallback (ADR 12) |
| Unit and component tests | Vitest, Testing Library, MSW |
| End-to-end and accessibility tests | Playwright, `@axe-core/playwright` |
| Lint and format | ESLint with `typescript-eslint` strict type-checked, `react-hooks`, `jsx-a11y`; Prettier |

Quality gates: `tsc --noEmit`, ESLint with `max-lines` of 200 and
`max-lines-per-function` of 40, the layer rules, and typed doubles of the
`SearchApi` port or MSW handlers instead of module mocks.

## Consequences

- The contract stays the single source of truth: a change to `openapi.yaml`
  that breaks the interface fails type checking.
- pnpm refuses phantom dependencies; reviewers without it run
  `corepack enable` once.
- React Aria provides the suggestion combobox, which Radix lacks, and handles
  keyboard and screen reader behaviour of every widget.
- `nuqs` keeps the query in the URL with history support without a router
  for a single page; a router can be added if pages multiply.
- Biome would be faster, but lacks part of the `react-hooks` and `jsx-a11y`
  rules the guardrails rely on.
- Stat bars and the stat profiles are CSS and SVG, with no chart library; the
  constellation is the one GPU scene, split into its own worker chunk. Motion, chosen first, weighed 40 kB gzip for effects CSS
  covers, and was dropped to hold the bundle budget of ADR 11.
