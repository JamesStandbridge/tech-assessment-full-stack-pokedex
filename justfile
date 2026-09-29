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

# Lint every Python project
lint:
    mise run lint

# Format and autofix every Python project
format:
    mise run format

# Type check every Python project
typecheck:
    mise run typecheck

# Check the backend layer contracts
layers:
    mise run layers

# Run every unit test suite
test:
    mise run test

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

# Remove caches and virtual environments
clean:
    mise run clean
