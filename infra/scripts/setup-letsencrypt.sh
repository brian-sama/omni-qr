#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "[tls] Run this script as root."
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEPLOY_SCRIPT="$ROOT_DIR/infra/scripts/deploy.sh"

DOMAIN="${DOMAIN:-scansuite.co.zw}"
WWW_DOMAIN="${WWW_DOMAIN:-www.scansuite.co.zw}"
EXPECTED_IP="${EXPECTED_IP:-89.116.26.24}"
CERTBOT_IMAGE="${CERTBOT_IMAGE:-certbot/certbot:latest}"
EMAIL="${1:-${LETSENCRYPT_EMAIL:-}}"

if [[ -z "$EMAIL" ]]; then
  echo "Usage: $0 <letsencrypt-email>"
  echo "Example: $0 ops@scansuite.co.zw"
  exit 1
fi

check_dns_ip() {
  local host="$1"
  local resolved
  resolved="$(getent ahostsv4 "$host" | awk '{print $1}' | sort -u)"

  if [[ -z "$resolved" ]]; then
    echo "[tls] DNS check failed: no A record found for $host"
    exit 1
  fi

  if ! grep -qx "$EXPECTED_IP" <<< "$resolved"; then
    echo "[tls] DNS check failed for $host"
    echo "[tls] Expected: $EXPECTED_IP"
    echo "[tls] Found:"
    echo "$resolved"
    exit 1
  fi
}

echo "[tls] Verifying DNS records"
check_dns_ip "$DOMAIN"
check_dns_ip "$WWW_DOMAIN"

echo "[tls] Ensuring certbot directories exist"
mkdir -p /var/www/certbot
mkdir -p /etc/letsencrypt

echo "[tls] Deploying bootstrap stack (HTTP + ACME challenge)"
"$DEPLOY_SCRIPT"

echo "[tls] Requesting Let's Encrypt certificate"
docker run --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/www/certbot:/var/www/certbot \
  "$CERTBOT_IMAGE" certonly \
  --webroot \
  -w /var/www/certbot \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  --keep-until-expiring \
  -d "$DOMAIN" \
  -d "$WWW_DOMAIN"

echo "[tls] Enabling TLS nginx config"
"$DEPLOY_SCRIPT"

echo "[tls] Verifying HTTPS endpoint"
curl -fsSI "https://$DOMAIN" > /dev/null

echo "[tls] Setup complete"
