#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infra/compose/docker-compose.production.yml"
NGINX_DIR="$ROOT_DIR/infra/nginx"
NGINX_ACTIVE_CONF="$NGINX_DIR/nginx.conf"
NGINX_BOOTSTRAP_CONF="$NGINX_DIR/nginx.bootstrap.conf"
NGINX_SSL_CONF="$NGINX_DIR/nginx.ssl.conf"
LETSENCRYPT_DOMAIN="${LETSENCRYPT_DOMAIN:-scansuite.co.zw}"
LETSENCRYPT_LIVE_DIR="${LETSENCRYPT_LIVE_DIR:-/etc/letsencrypt/live/$LETSENCRYPT_DOMAIN}"
CERT_FULLCHAIN="$LETSENCRYPT_LIVE_DIR/fullchain.pem"
CERT_PRIVKEY="$LETSENCRYPT_LIVE_DIR/privkey.pem"

cd "$ROOT_DIR"

if [[ -f "$CERT_FULLCHAIN" && -f "$CERT_PRIVKEY" ]]; then
  echo "[deploy] TLS certificate found at $LETSENCRYPT_LIVE_DIR. Using TLS nginx config."
  cp "$NGINX_SSL_CONF" "$NGINX_ACTIVE_CONF"
else
  echo "[deploy] TLS certificate not found. Using bootstrap nginx config."
  cp "$NGINX_BOOTSTRAP_CONF" "$NGINX_ACTIVE_CONF"
fi

echo "[deploy] Pulling infrastructure images"
docker compose -f "$COMPOSE_FILE" pull nginx postgres minio minio-init

APP_SERVICES=()
if [[ -n "${API_IMAGE:-}" ]]; then
  APP_SERVICES+=("api")
fi
if [[ -n "${WEB_IMAGE:-}" ]]; then
  APP_SERVICES+=("web")
fi

if (( ${#APP_SERVICES[@]} > 0 )); then
  echo "[deploy] Pulling app images for: ${APP_SERVICES[*]}"
  docker compose -f "$COMPOSE_FILE" pull "${APP_SERVICES[@]}"
else
  echo "[deploy] API_IMAGE/WEB_IMAGE not set. web/api will use local build context."
fi

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

