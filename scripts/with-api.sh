#!/usr/bin/env bash
# Run a command against a search API started from the current code on a
# dedicated port, so a development server running older code is never tested.
set -euo pipefail

port="${POKEDEX_TEST_PORT:-8001}"
url="http://127.0.0.1:$port"
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

ready() {
  curl --silent --fail --max-time 1 "$url/api/health" >/dev/null 2>&1
}

if ready; then
  echo "Port $port is already taken by a search API; stop it or set POKEDEX_TEST_PORT." >&2
  exit 1
fi

(cd "$root/backend" && POKEDEX_PORT="$port" exec uv run --quiet serve) &
api_pid=$!
trap 'kill "$api_pid" 2>/dev/null || true; wait "$api_pid" 2>/dev/null || true' EXIT

for _ in $(seq 1 150); do
  if ready; then
    POKEDEX_API_URL="$url" "$@"
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
