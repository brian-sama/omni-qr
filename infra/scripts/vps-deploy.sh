#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.production}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE" >&2
  exit 1
fi

cd "$ROOT_DIR"

docker compose --env-file "$ENV_FILE" build api web
docker compose --env-file "$ENV_FILE" up -d postgres minio minio-init
docker compose --env-file "$ENV_FILE" up -d api

if [[ "${RUN_SEED:-false}" == "true" ]]; then
  docker compose --env-file "$ENV_FILE" run --rm --profile ops seed
fi

docker compose --env-file "$ENV_FILE" up -d web
docker compose --env-file "$ENV_FILE" ps
