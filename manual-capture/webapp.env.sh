# Variáveis do webapp para as capturas; fonte: o env de integração do gatekeeper já carregado.
export DATAMAP_BASE_URL="${MANUAL_GATEKEEPER_URL:-http://localhost:9094/api/v1}"
export DATAMAP_API_KEY="$MANUAL_API_KEY"
export DATAMAP_API_SECRET="$MANUAL_API_SECRET"
export NEXTAUTH_URL="${MANUAL_WEBAPP_URL:-http://localhost:3100}"
export NEXTAUTH_SECRET="guia-do-usuario-nextauth"
export TOKEN_SECRET="guia-do-usuario-token"
export NEXT_PUBLIC_TUS_SERVICE_ENDPOINT="http://localhost:1081/files/"
export METRICS_PORT="${MANUAL_METRICS_PORT:-9196}"
export NEXT_DIST_DIR=".next-manual"
export NEXT_TELEMETRY_DISABLED=1
