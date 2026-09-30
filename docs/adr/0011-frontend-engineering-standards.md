# 11. Hold the interface to the same engineering standards as the backend

- Status: accepted
- Date: 2026-09-30

## Context and problem statement

The backend is held to explicit, machine-checked standards: strict typing,
layer contracts, size limits, typed doubles of every port. The interface must
meet the same bar, translated to React, the web platform and HTTP. A standard
that no tool or review step enforces erodes, so every rule below names what
enforces it.

## Decision outcome

### Architecture and SOLID

| Principle | Rule in the interface | Enforced by |
|---|---|---|
| Single responsibility | A module does one thing: a hook fetches or derives, a component renders. Data access lives in feature hooks, never in components of `ui`. | `dependency-cruiser`, review |
| Open and closed | Result views are registered in a `Record<Reading, ResultsView>` checked with `satisfies`; a new reading adds an entry and fails to compile until it does. | `tsc` |
| Liskov substitution | Every result view takes the same `ResultsViewProps` and can replace another. | `tsc` |
| Interface segregation | Separate ports `SearchApi`, `SuggestApi` and `EntityApi`; components receive only the props they read. | `tsc`, review |
| Dependency inversion | Features depend on ports provided by the composition root in `app`; tests provide typed doubles. No feature imports the concrete client. | `dependency-cruiser` |

- Layers `api`, `domain`, `ui`, `features` and `app` of ADR 9, with no cycles.
- Modules of at most 200 lines, functions of at most 40 lines, cyclomatic
  complexity of at most 10, at most three parameters: several values travel
  as one typed object.
- Named exports only, except where a tool requires a default export.

### TypeScript

- `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
  `noImplicitOverride`, `verbatimModuleSyntax`.
- No `any`, no non-null assertion, no type assertion except at a validated
  boundary.
- Every `switch` over a union ends with an `assertNever` default, and
  `switch-exhaustiveness-check` is an error.
- Contract types come only from the generated `openapi.yaml` types; view
  models are derived from them, never redeclared.
- Unions of string literals instead of `enum`; props and view models are
  `readonly`.

### React

- Function components and hooks only; the React Compiler memoizes, so manual
  `useMemo`, `useCallback` and `memo` need a measured reason.
- Server state is TanStack Query's, URL state is `nuqs`', and the rest is local
  state colocated with its use. No global store.
- No effect for derived state or data fetching. Effects only synchronize with
  systems outside React: the constellation worker, media queries, keyboard
  shortcuts and storage.
- List keys are stable identifiers such as `kind:name`, never array indices.
- Each result view sits behind an error boundary, and heavy views such as the
  relation graph load lazily behind `Suspense`.
- Context carries only dependencies of the composition root, such as the
  ports, never frequently changing state.

Enforced by `eslint-plugin-react-hooks` with the compiler rules, the React
rules of ESLint, and review.

### Web platform and accessibility

- Semantic HTML first: a `search` landmark with a `form`, headings in order,
  lists for results, `button` for actions and `a` for navigation.
- Every widget is operable with the keyboard, with a visible focus; the
  details dialog traps and restores focus (React Aria).
- Colour is never the only carrier of meaning; contrast meets WCAG 2.2 AA.
- Movement respects `prefers-reduced-motion` (SYS-A11Y-003); no sound without
  a user action (SYS-A11Y-004).
- Images declare their size, load lazily below the fold, and fall back to a
  placeholder (SYS-UI-003).

Enforced by `eslint-plugin-jsx-a11y` strict, `@axe-core/playwright` in the
interface scenarios, and the scenarios of `specs/ui/accessibility.feature`.

### Performance

| Budget | Limit | Enforced by |
|---|---|---|
| Initial JavaScript, compressed | 150 kB | `size-limit` on the production build |
| Constellation worker, compressed | 260 kB | `size-limit` on the production build |
| Largest Contentful Paint | 2.5 s | Lighthouse CI on the production preview |
| Cumulative Layout Shift | 0.1 | Lighthouse CI |
| Total Blocking Time | 200 ms | Lighthouse CI |
| Searches per pause of typing | 1 | the SYS-UI-022 scenario |

- The results region, the details, the stat overlay and the constellation
  worker are split out of the initial bundle and loaded on demand; the worker
  starts after the first paint and never draws the largest contentful element; the results region is
  fetched as soon as the URL holds a query. The initial JavaScript is 120 kB
  gzip, and the mobile Largest Contentful Paint of a weather search sits just
  under its budget, at 2.49 s.
- Lists of more than a page render incrementally through section cursors,
  never all at once.

### HTTP

- The client only sends `GET`, builds query strings with `URLSearchParams`,
  and aborts a request as soon as its query is no longer current.
- Errors are typed by status: 400 is an invalid query shown with the API's
  message, 404 a missing entity, 5xx and network failures a failure with a
  retry. Only failures are retried automatically, twice with backoff; a 4xx is
  never retried.
- Requests time out after 10 seconds.
- Responses are cached by TanStack Query per query, and revalidated by the
  browser through the API's validators.

The API must provide those validators and meet the same standard:

- `ETag` from the dataset version and the request, with `304 Not Modified` on
  `If-None-Match`, and `Cache-Control: no-cache` so every reuse is validated.
- Compression of responses above 1 kB.
- `HEAD` on every `GET` resource, as RFC 9110 requires.
- `X-Content-Type-Options: nosniff` on every response.

### Security

- No `dangerouslySetInnerHTML`; dataset text is rendered as text.
- A Content Security Policy on the production build, as a header of the
  preview server and a meta tag for static hosts: scripts and styles from the
  same origin, plus the SHA-256 of the one stylesheet React Aria's usePress
  injects, images from the same origin and the artwork host, connections to
  the origin only. Every interface scenario fails on a policy violation.
- Links opening a new tab use `rel="noopener noreferrer"`.
- No secret in the client; configuration comes from `import.meta.env` with
  typed, validated values.
- `pnpm audit` finds no high vulnerability in production dependencies and no
  critical one anywhere; the lock file is committed. Development tools may
  carry a high finding without a fix, such as extract-zip under Lighthouse,
  which is only reached when a browser archive is downloaded and never runs
  here since Lighthouse uses Playwright's Chromium.

### Tests

| Layer | Tests | Doubles |
|---|---|---|
| `domain` | Vitest unit tests, including the reading rule of ADR 10 | none, pure functions |
| `api` | Vitest tests of error translation and cancellation | MSW handlers typed by the contract |
| `ui` | Testing Library tests of behaviour and accessible names | none |
| `features` | Testing Library tests through user events | typed doubles of the ports |
| whole interface | `playwright-bdd` scenarios of `specs/ui` | the real API; route interception only for slowness, failures and images |

- Tests query by role and accessible name, never by class or test id unless
  no accessible query exists.
- No snapshot tests of markup.
- Coverage of `domain` and `api` of at least 90% of branches.

### Gates

`just check` runs, for the interface: `tsc --noEmit`, ESLint with zero
warnings, Prettier in check mode, `dependency-cruiser`, `knip` for unused files,
exports and dependencies, Vitest with coverage thresholds, and `size-limit`.
`just verify` adds the `playwright-bdd` scenarios, axe checks and Lighthouse CI
against the real API.

## Consequences

- Each rule can fail a build, so a breach is found when it is written, not in
  review.
- The React Compiler removes most manual memoization, at the cost of a Babel
  step in the Vite build.
- The HTTP obligations add work to the backend: validators, compression, `HEAD`
  and `nosniff` come before the interface consumes the API.
- Lighthouse CI needs a production build and a browser, so it runs in
  `just verify`, not in `just check`.
