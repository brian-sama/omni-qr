#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infra/compose/docker-compose.production.yml"

cd "$ROOT_DIR"

echo "[deploy] Pulling latest images"
docker compose -f "$COMPOSE_FILE" pull

echo "[deploy] Restarting services"
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

echo "[deploy] Waiting for health checks"
sleep 8

set +e
curl -fsS http://localhost/health/live > /dev/null
HEALTH_EXIT_CODE=$?
set -e

if [[ "$HEALTH_EXIT_CODE" -ne 0 ]]; then
  echo "[deploy] Health check failed. Printing recent logs."
  docker compose -f "$COMPOSE_FILE" logs --tail 200
  exit 1
fi

echo "[deploy] Deployment successful"

