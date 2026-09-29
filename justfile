# Entry point of the project tasks. Every recipe runs the mise task of the same
# name, so just <task> and mise run <task> behave the same.

set shell := ["bash", "-euo", "pipefail", "-c"]

# List the recipes
default:
    @just --list

# Prepare a fresh clone: runtimes, dependencies and dataset
setup:
    mise run setup

# Install every dependency
install:
    mise run install

# Download the published snapshot and verify its checksum
data:
    mise run data

# Run the development processes with process-compose
dev:
    mise run dev

# Stop the development processes of this project
dev-down:
    mise run dev:down

# Run the search API
serve:
    mise run serve

# Run the interface development server
web:
    mise run web

# Regenerate the frontend contract types from specs/api/openapi.yaml
api-types:
    mise run api:types

# Lint every project
lint:
    mise run lint

# Format and autofix every project
format:
    mise run format

# Type check every project
typecheck:
    mise run typecheck

# Check the layer rules of every project
layers:
    mise run layers

# Run every unit test suite
test:
    mise run test

# Check the initial JavaScript budget of the production build
size:
    mise run size

# Check that the specifications are consistent
specs:
    mise run specs

# Run every check that needs no running API
check:
    mise run check

# Run the Gherkin acceptance scenarios against the search API
acceptance:
    mise run acceptance

# Evaluate relevance against the judgments and the assessor grades
relevance:
    mise run relevance

# Run every check, then the acceptance and relevance suites
verify:
    mise run verify

# Report the versions of the tools and whether the dataset is ready
doctor:
    mise run doctor

# Remove caches, virtual environments, dependency directories and builds
clean:
    mise run clean
