#!/usr/bin/env bash
# Run a command against the search API. An API already answering is reused;
# otherwise one is started for the duration of the command.
set -euo pipefail

url="${POKEDEX_API_URL:-http://127.0.0.1:8000}"
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

ready() {
  curl --silent --fail --max-time 1 "$url/api/health" >/dev/null 2>&1
}

if ready; then
  exec "$@"
fi

(cd "$root/backend" && exec uv run --quiet serve) &
api_pid=$!
trap 'kill "$api_pid" 2>/dev/null || true; wait "$api_pid" 2>/dev/null || true' EXIT

for _ in $(seq 1 150); do
  if ready; then
    "$@"
    exit $?
  fi
  if ! kill -0 "$api_pid" 2>/dev/null; then
    echo "The search API exited before it was ready." >&2
    exit 1
  fi
  sleep 0.1
done
echo "The search API was not ready at $url after 15 seconds." >&2
exit 1
