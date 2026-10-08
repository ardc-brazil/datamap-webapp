#!/usr/bin/env bash
# Sobe ou derruba a stack de integração do gatekeeper para as capturas do guia.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GATEKEEPER_DIR="$(cd "${GATEKEEPER_DIR:-$HERE/../../gatekeeper}" && pwd)"
RUN_DIR="$HERE/.run"
ENV_FILE="$RUN_DIR/gatekeeper.env"
API="http://localhost:9094/api/v1"

prepare_env() {
  mkdir -p "$RUN_DIR"
  # O tusd avisa o gatekeeper pela rede do compose; o valor original aponta para o host, onde nada escuta.
  sed 's#^TUS_HOOK_API=.*#TUS_HOOK_API=http://datamap_gatekeeper_test_integration:9092/api/v1/tus/hooks#' \
    "$GATEKEEPER_DIR/integration-test.env" > "$ENV_FILE"
  # Na stack de integração só existe o usuário root do MinIO; sem isso o tusd leva 403 ao criar o envio.
  local root_user root_password
  root_user=$(sed -n 's/^MINIO_ROOT_USER=//p' "$ENV_FILE")
  root_password=$(sed -n 's/^MINIO_ROOT_PASSWORD=//p' "$ENV_FILE")
  sed -i.bak -e "s#^AWS_ACCESS_KEY_ID=.*#AWS_ACCESS_KEY_ID=$root_user#" -e "s#^AWS_SECRET_ACCESS_KEY=.*#AWS_SECRET_ACCESS_KEY=$root_password#" "$ENV_FILE"
  rm -f "$ENV_FILE.bak"
  set -a; . "$ENV_FILE"; set +a
}

check_ports() {
  local busy
  busy=$(docker ps --format '{{.Names}} {{.Ports}}' | grep -E ':(5433|9094|8025|1081)->' | grep -v '_test_integration' || true)
  if [ -n "$busy" ]; then
    echo "Porta da stack de integração ocupada por outro container:" >&2
    echo "$busy" >&2
    exit 1
  fi
}

gatekeeper_make() {
  make -C "$GATEKEEPER_DIR" ENV_FILE_PATH="$ENV_FILE" "$@"
}

wait_for() {
  local description="$1" url="$2"; shift 2
  for _ in $(seq 1 90); do
    if [ "$(curl -s -o /dev/null -w '%{http_code}' "$@" "$url")" = 200 ]; then
      echo "ok: $description"
      return 0
    fi
    sleep 2
  done
  echo "A stack não ficou pronta: $description" >&2
  gatekeeper_make integration-test-logs 2>&1 | tail -80 >&2 || true
  exit 1
}

up() {
  prepare_env
  check_ports
  # O compose reaproveita o volume nomeado e ignora um `device` novo; sem o -v o banco também sobra da rodada anterior.
  gatekeeper_make integration-test-clean >/dev/null
  mkdir -p "$GATEKEEPER_DIR/${STORAGE_DOCKER_VOLUME}_test_integration/datamap"
  gatekeeper_make integration-test-up 2>&1 | grep -v "timeout: command not found\|may not be ready" || true
  wait_for "gatekeeper" "$API/health-check/"
  docker exec datamap_postgres_test_integration psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -q -f /tmp/seed_clients.sql
  # O Casbin recarrega a política a cada 5 s; antes disso o seed leva 401.
  wait_for "política carregada" "$API/clients/" \
    -H "X-Api-Key: $INTEGRATION_API_KEY" -H "X-Api-Secret: $INTEGRATION_API_SECRET" \
    -H "X-User-Id: $INTEGRATION_USER_ID" -H "X-Datamap-Tenancies: $INTEGRATION_TENANCY"
}

down() {
  prepare_env
  gatekeeper_make integration-test-down >/dev/null
}

case "${1:-}" in
  up) up ;;
  down) down ;;
  *) echo "uso: stack.sh up|down" >&2; exit 2 ;;
esac
