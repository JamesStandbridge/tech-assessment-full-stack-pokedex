#!/usr/bin/env bash
# Report the tools of the development environment and whether the dataset is ready.
set -uo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
dataset="$root/data/pokedex.json"
expected_sha256="251b7a02837bcb01a491e40de488ef179c95df7d7cb7e0aec1f4562d9d16cadb"
problems=0

report() {
  local name="$1"
  shift
  local version
  if version="$("$@" 2>/dev/null | head -n 1)" && [[ -n "$version" ]]; then
    printf '  %-16s %s\n' "$name" "$version"
  else
    printf '  %-16s missing\n' "$name"
    problems=$((problems + 1))
  fi
}

echo "Tools:"
report flox flox --version
report just just --version
report mise mise --version
report process-compose process-compose version --short
report python python --version
report uv uv --version

echo "Dataset:"
if [[ ! -f "$dataset" ]]; then
  echo "  missing; run just data"
  problems=$((problems + 1))
elif [[ "$(shasum -a 256 "$dataset" | cut -d ' ' -f 1)" != "$expected_sha256" ]]; then
  echo "  checksum mismatch; run just data"
  problems=$((problems + 1))
else
  echo "  $dataset verified"
fi

if ((problems > 0)); then
  echo "$problems problem(s) found. Run flox activate, then just setup."
  exit 1
fi
echo "Ready."
