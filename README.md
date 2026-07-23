# Technical Exercise — The Pokédex Search Engine

## Context

Professor Chen leads a growing research lab whose Pokédex has become difficult
to use. It contains information about Pokémon, moves, abilities, types, stats,
and relationships, but finding useful information still requires knowing
exactly where to look and what something is called.

The Pokédex is used by people with different levels of knowledge. An experienced
researcher may look for a specific move, while a new trainer may remember only
part of a name, a characteristic, an effect, or a gameplay intent. A query may
also be relevant to several kinds of entities.

Your challenge is not only to display data. It is to decide which search
problems to solve, what makes a result relevant, and how to turn those decisions
into a coherent full-stack product.

## Expected effort

This exercise is designed to take approximately **8–12 hours of focused work**.
This estimate is guidance to help you size your solution, not a monitored time
limit. You will receive a separate calendar deadline, normally about one week.

AI-assisted development tools are allowed and expected to accelerate
implementation. Prioritise a coherent, understandable, and validated product
within the expected effort rather than expanding the scope unnecessarily.
Explain what you would do next with more time.

## The mission

Build a full-stack web application in which users submit a query and obtain
useful results from the provided Pokémon data.

The minimum is deliberately small: a working frontend, a backend retrieval
flow, meaningful results, tests, and clear documentation. Beyond that
foundation, choose the user needs and product scope that best demonstrate your
judgment and technical depth.

## Illustrative search challenges

The following situations progress from a focused lookup to broader,
exploratory needs.

1. **Recover something partially remembered.** A new trainer saw a Pokémon
   whose name began with `bulba`, but cannot remember the full name. They want
   to find it quickly and confirm that it is the Pokémon they had in mind.
2. **Find and compare candidates from practical criteria.** A trainer has one
   place left in their team and wants a fast Electric-type Pokémon. They need
   useful candidates and enough comparable information to make a choice.
3. **Discover an answer without knowing its vocabulary.** A trainer wants a
   way to put an opponent to sleep, but does not know which moves, abilities,
   or Pokémon can help. They need results that make the relevant relationship
   understandable.
4. **Explore a strategy spanning connected information.** An experienced
   trainer is building a rain-oriented team. They want to discover ways to
   take advantage of rain, Pokémon that benefit from it, and useful related
   options, without searching each category separately.

These are product situations, not an exhaustive acceptance test or a required
feature list. Your application does not need to solve all four. State which
needs you support, what you deliberately leave out, and show how the submitted
product helps its intended users.

## Minimum requirements

### R1 — Frontend search experience

Provide a usable web interface where a user can enter a query and inspect
results. Include understandable loading, empty, and error states.

You decide how results and supporting information should be presented.

### R2 — Backend retrieval

The frontend must retrieve results through a backend or server-side API. Define
and document the contract that fits your product.

The backend must:

- accept a user query;
- retrieve results from the provided dataset;
- return enough information for the frontend to render the chosen experience;
- validate invalid or empty input; and
- handle unexpected failures without exposing raw stack traces or secrets.

Choose and document the interface that fits your application.

### R3 — Search scope and relevance

Implement a coherent search experience over Pokémon data. At minimum, the
application must return useful results for one clearly supported kind of user
need.

You decide what information is searchable, which kinds of results belong
together, and what makes a result useful. The experience should behave
deliberately when a request is ambiguous, unsupported, or has no useful result.
Document the scope and the product decisions behind it.

### R4 — Data and reproducibility

Use the published [`pokedex.json` snapshot](https://biolevatestatics.blob.core.windows.net/biolevate-tech-assessments/pokedex/pokedex.json)
as the common baseline. Download instructions, its checksum, schema, and
provenance are documented in
[`candidate-resources/`](candidate-resources/). You may transform or prepare it
locally.

You may supplement it with another data source or optional service, provided:

- the baseline application remains reviewable without paid access;
- setup, credentials, costs, quotas, and availability constraints are
  documented; and
- reviewers can reproduce the demonstrated queries without access to your
  local state.

### R5 — Automated tests and evaluation

Add automated tests for the behaviour you consider most important. At minimum,
cover:

- one successful backend retrieval;
- invalid or empty input;
- a no-result or controlled fallback case; and
- one important search behaviour claimed by your solution.

The last test should make your definition of relevance observable. It does not
need to match a company-provided expected result set.

### R6 — Local execution

The application and tests must run locally from documented commands. Do not
commit secrets or generated dependency directories. Include an `.env.example`
when environment variables are required and any scripts needed to prepare or
load the data.

### R7 — Submission documentation

Provide an up-to-date project `README` containing:

- setup, run, and test commands;
- a description of the architecture and end-to-end data flow;
- the user needs you chose to support and how the product serves them;
- important decisions, trade-offs, and alternatives considered;
- known limitations and what you would do next;
- the approximate time you spent;
- five representative queries, their relevant results, and what each query
  demonstrates;
- how you validated correctness and relevance; and
- the AI-tool disclosure described below, if applicable.

Keep the decision and trade-off write-up concise; approximately 500–800 words
is enough, excluding setup instructions and query examples.

## Product expectations

Whatever scope you choose, aim for a product that:

- helps its intended users make progress rather than merely exposing raw data;
- provides enough context to understand why a result may be useful;
- behaves consistently for the needs it claims to support;
- remains understandable when different kinds of information appear together;
- handles unsupported or uncertain requests honestly; and
- demonstrates its value through representative queries and tests.

We are interested in how you frame and solve the product problem. We do not
expect every submission to offer the same features or use the same approach.
Additional product care, such as accessibility or responsive design, is
welcome but not required.

## Technical freedom

There is no prescribed technology stack or implementation approach. Choose
tools that fit your intended experience and that you can explain.

The implementation may be as simple or specialised as the supported product
needs justify. External paid services must be optional and must have a
functional local or free fallback for review.

## Out of scope

You are not expected to build:

- authentication, user accounts, or an administration interface;
- data editing or continuous synchronisation with PokéAPI;
- production deployment, CI/CD, monitoring, or cloud infrastructure;
- exhaustive support for every Pokémon generation or entity type;
- localisation; or
- exhaustive test coverage.

You may deliberately omit any of the more ambitious product situations.
Document the omission instead of submitting an unfinished feature.

## Deliverables

Send a Git repository link or a zip archive containing:

- the complete source code;
- the documentation and configuration described in R7; and
- all files needed to run the application and its tests.

## Use of AI tools

You may use AI-assisted tools. If you do, include a short disclosure stating:

- which tools you used;
- what you used them for;
- how you reviewed or validated their output; and
- one example of an important suggestion you changed or rejected, if
  applicable.

Use of AI is not evaluated negatively. You remain responsible for understanding
and being able to explain every part of your submission.

## What we assess

We assess:

- quality and coherence of the end-to-end product;
- usefulness and depth of the search experience within the scope you chose;
- full-stack architecture, data modelling, and error handling;
- code quality and maintainability;
- usefulness of tests and search evaluation;
- prioritisation within the expected effort; and
- clarity of documentation and trade-offs.

The detailed scoring guide is internal, but there are no hidden assessment
dimensions. A focused product that solves one difficult user need well can be
stronger than a broad collection of unfinished features.
