#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infra/compose/docker-compose.production.yml"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-$(basename "$ROOT_DIR" | tr '[:upper:]' '[:lower:]')}"
MINIO_VOLUME="${COMPOSE_PROJECT_NAME}_minio_data"
BACKUP_ROOT="${BACKUP_ROOT:-$ROOT_DIR/backups}"
TODAY="$(date +%F)"
WEEK_TAG="$(date +%G-%V)"
MONTH_TAG="$(date +%Y-%m)"

mkdir -p "$BACKUP_ROOT/daily/$TODAY"
mkdir -p "$BACKUP_ROOT/weekly"
mkdir -p "$BACKUP_ROOT/monthly"

DAILY_PATH="$BACKUP_ROOT/daily/$TODAY"

echo "[backup] Dumping PostgreSQL"
docker compose -f "$COMPOSE_FILE" exec -T postgres \
  pg_dump -U "${POSTGRES_USER:-scansuite}" "${POSTGRES_DB:-scansuite}" > "$DAILY_PATH/database.sql"

gzip -f "$DAILY_PATH/database.sql"

echo "[backup] Archiving MinIO data volume"
docker run --rm \
  -v "$MINIO_VOLUME:/data" \
  -v "$DAILY_PATH":/backup \
  alpine:3.21 \
  sh -c 'cd /data && tar -czf /backup/minio-data.tgz .'

if [[ "$(date +%u)" -eq 7 ]]; then
  rm -rf "$BACKUP_ROOT/weekly/$WEEK_TAG"
  cp -r "$DAILY_PATH" "$BACKUP_ROOT/weekly/$WEEK_TAG"
fi

if [[ "$(date +%d)" == "01" ]]; then
  rm -rf "$BACKUP_ROOT/monthly/$MONTH_TAG"
  cp -r "$DAILY_PATH" "$BACKUP_ROOT/monthly/$MONTH_TAG"
fi

find "$BACKUP_ROOT/daily" -mindepth 1 -maxdepth 1 -type d | sort | head -n -7 | xargs -r rm -rf
find "$BACKUP_ROOT/weekly" -mindepth 1 -maxdepth 1 -type d | sort | head -n -4 | xargs -r rm -rf
find "$BACKUP_ROOT/monthly" -mindepth 1 -maxdepth 1 -type d | sort | head -n -3 | xargs -r rm -rf

echo "[backup] Completed"

