#!/usr/bin/env bash
# Start a dev server, run the integration/regression suite against it, tear down.
set -uo pipefail
cd "$(dirname "$0")/.."

PORT="${TEST_PORT:-3110}"
BASE="http://localhost:${PORT}"
LOG="/tmp/crmhub-test-server.log"

echo "[test] starting dev server on :${PORT} ..."
# Dev mode (auth disabled) — the suite asserts the dev-scoping behaviour.
nohup npm run dev -- -p "${PORT}" > "${LOG}" 2>&1 &
SERVER_PID=$!

cleanup() {
  echo "[test] stopping dev server (pid ${SERVER_PID}) ..."
  kill "${SERVER_PID}" 2>/dev/null
  pkill -f "next dev -p ${PORT}" 2>/dev/null
}
trap cleanup EXIT

# Wait for readiness (up to ~60s; first compile can be slow)
for i in $(seq 1 60); do
  if curl -s -m 2 "${BASE}/api/health" >/dev/null 2>&1; then break; fi
  sleep 1
done
if ! curl -s -m 2 "${BASE}/api/health" >/dev/null 2>&1; then
  echo "[test] server failed to start — last log lines:"; tail -20 "${LOG}"; exit 1
fi
# Warm the workspace pages so first-hit compiles don't time out the assertions
curl -s -m 60 -o /dev/null "${BASE}/portfolio" || true
curl -s -m 60 -o /dev/null "${BASE}/demo/dashboard" || true

echo "[test] running suite ..."
TEST_BASE="${BASE}" node --test --test-concurrency=1 tests/crm.test.mjs
RESULT=$?

exit "${RESULT}"
