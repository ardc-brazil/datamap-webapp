#!/usr/bin/env bash
# Gera as capturas do guia: stack de integração, build, seed e cenas.
# MANUAL_KEEP=1 deixa a stack e o servidor de pé ao terminar.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEBAPP_DIR="$(cd "$HERE/.." && pwd)"
PORT="${MANUAL_PORT:-3100}"
SERVER_PID=""
TS_NODE=(npx ts-node -P "$HERE/tsconfig.json")

cleanup() {
  if [ -n "$SERVER_PID" ]; then kill "$SERVER_PID" 2>/dev/null || true; fi
  if [ "${MANUAL_KEEP:-0}" != 1 ]; then "$HERE/stack.sh" down || true; fi
}
trap cleanup EXIT

if curl -s -o /dev/null "http://localhost:$PORT/"; then
  echo "A porta $PORT já está em uso; use MANUAL_PORT=<outra>." >&2
  exit 1
fi

"$HERE/stack.sh" up

set -a
. "$HERE/.run/gatekeeper.env"
set +a
export MANUAL_API_KEY="$INTEGRATION_API_KEY"
export MANUAL_API_SECRET="$INTEGRATION_API_SECRET"
export MANUAL_ADMIN_USER_ID="$INTEGRATION_USER_ID"
export MANUAL_ADMIN_TENANCY="$INTEGRATION_TENANCY"
export MANUAL_WEBAPP_URL="http://localhost:$PORT"
. "$HERE/webapp.env.sh"

cd "$WEBAPP_DIR"
npm run build

npx next start -p "$PORT" > "$HERE/.run/next.log" 2>&1 &
SERVER_PID=$!
for _ in $(seq 1 60); do
  [ "$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/account/login")" = 200 ] && break
  sleep 1
done
curl -sf -o /dev/null "http://localhost:$PORT/account/login" || { echo "O webapp não subiu; veja manual-capture/.run/next.log" >&2; exit 1; }

"${TS_NODE[@]}" "$HERE/seed.ts"
"${TS_NODE[@]}" "$HERE/run.ts"
"${TS_NODE[@]}" "$HERE/pdf.ts"
