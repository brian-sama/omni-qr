# Scan Suite Monorepo

Scan Suite is a production-oriented meeting distribution platform for enterprise environments.

## What Is Included

- `apps/web`: Next.js App Router frontend (premium SaaS UI, dark mode default, onboarding, dashboard, meetings, public QR pages)
- `apps/api`: Express + Socket.IO backend (`/api/v1`), PostgreSQL via Prisma, MinIO/S3 presigned file access
- `packages/shared`: Shared Zod contracts and cross-app types
- `infra/compose/docker-compose.production.yml`: Production stack (`nginx`, `web`, `api`, `postgres`, `minio`, `minio-init`)
- `infra/nginx/nginx.conf`: Reverse proxy + websocket + basic hardening
- `.github/workflows`: CI/CD for test/build/deploy

## Core Features Implemented

- Versioned API base path: `/api/v1`
- Auth with HTTP-only cookies, refresh token rotation, and session revocation
- RBAC middleware (`OWNER`, `ADMIN`, `EDITOR`, `VIEWER`)
- Meeting lifecycle states (`DRAFT`, `ACTIVE`, `EXPIRED`, `ARCHIVED`)
- Presigned upload/download flow (direct object storage, no API file streaming bottleneck)
- Public meeting access flow with password verification and short-lived scoped access token
- Live socket events namespace `/ws`:
  - `scan.updated`
  - `file.added`
  - `file.versioned`
  - `meeting.updated`
- Structured backend logging (Pino)
- Sentry hooks (web/api DSN env-driven)
- Health endpoints:
  - `GET /health/live`
  - `GET /health/ready`

## Local Development

### 1) Install dependencies

```bash
npm ci
```

### 2) Configure environment

```bash
cp .env.example .env
```

### 3) Run supporting services (Postgres + MinIO)

```bash
docker compose -f infra/compose/docker-compose.production.yml up -d postgres minio minio-init
```

### 4) Generate Prisma client and run migration

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 5) Start apps

```bash
npm run dev
```

- Web: `http://localhost:3000`
- API: `http://localhost:4000`

## Test + Validation

```bash
npm run lint
npm run typecheck
npm run test
```

## Production Deployment

### Container deployment

```bash
docker compose -f infra/compose/docker-compose.production.yml up -d --build
```

### Operational scripts

- Deploy script: `infra/scripts/deploy.sh`
  - Pulls infra images, then conditionally pulls app images when `API_IMAGE`/`WEB_IMAGE` are exported
  - Falls back to building app services from source if app image vars are not set
- Backup script: `infra/scripts/backup.sh`
- Initial Let's Encrypt setup: `infra/scripts/setup-letsencrypt.sh`
- Let's Encrypt renewal: `infra/scripts/renew-letsencrypt.sh`

### CI/CD

- PR CI: `.github/workflows/ci.yml`
- Main branch CD: `.github/workflows/cd.yml`

Set required repository secrets:

- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_PORT`
- `VPS_SSH_KEY`
- `GHCR_USER`
- `GHCR_PAT`

## Security/Infra Notes

- Use Let's Encrypt certificates for `scansuite.co.zw` and `www.scansuite.co.zw`
- Enforce key-based SSH only on VPS
- Restrict public ingress to `80/443`; keep Postgres/MinIO private
- Rotate secrets before first production deploy
- Schedule nightly backups using `infra/scripts/backup.sh`

