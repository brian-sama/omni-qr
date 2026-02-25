#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "[tls-renew] Run this script as root."
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infra/compose/docker-compose.production.yml"
NGINX_ACTIVE_CONF="$ROOT_DIR/infra/nginx/nginx.conf"
NGINX_SSL_CONF="$ROOT_DIR/infra/nginx/nginx.ssl.conf"

DOMAIN="${DOMAIN:-scansuite.co.zw}"
CERTBOT_IMAGE="${CERTBOT_IMAGE:-certbot/certbot:latest}"
LETSENCRYPT_LIVE_DIR="${LETSENCRYPT_LIVE_DIR:-/etc/letsencrypt/live/$DOMAIN}"
CERT_FULLCHAIN="$LETSENCRYPT_LIVE_DIR/fullchain.pem"
CERT_PRIVKEY="$LETSENCRYPT_LIVE_DIR/privkey.pem"

echo "[tls-renew] Renewing certificates (if due)"
docker run --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/www/certbot:/var/www/certbot \
  "$CERTBOT_IMAGE" renew \
  --webroot \
  -w /var/www/certbot \
  --quiet

if [[ ! -f "$CERT_FULLCHAIN" || ! -f "$CERT_PRIVKEY" ]]; then
  echo "[tls-renew] Certificate files missing in $LETSENCRYPT_LIVE_DIR"
  exit 1
fi

cp "$NGINX_SSL_CONF" "$NGINX_ACTIVE_CONF"

echo "[tls-renew] Reloading nginx"
docker compose -f "$COMPOSE_FILE" up -d nginx
docker compose -f "$COMPOSE_FILE" exec -T nginx nginx -s reload

echo "[tls-renew] Renewal completed"
