# Scan Suite - Contabo VPS Deployment Guide

This guide deploys **Scan Suite** to your Contabo VPS (`89.116.26.24`) and maps it to `scansuite.co.zw`.

The production stack uses Docker Compose: `infra/compose/docker-compose.production.yml`.

## Prerequisites

1. Contabo VPS running Ubuntu 22.04 or 24.04.
2. SSH access to the VPS.
3. Domain control for `scansuite.co.zw`.

## Step 1: Server Setup

SSH into the server:

```bash
ssh root@89.116.26.24
```

Install required packages and Docker:

```bash
apt update && apt upgrade -y
apt install -y git curl ca-certificates

curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

docker --version
docker compose version
```

Optional firewall hardening:

```bash
apt install -y ufw
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

## Step 2: Point DNS to the VPS

Create these records at your DNS provider:

1. `A` record: `@` -> `89.116.26.24`
2. `A` record: `www` -> `89.116.26.24`

After propagation, verify from any machine:

```bash
nslookup scansuite.co.zw
nslookup www.scansuite.co.zw
```

## Step 3: Put Project on the VPS

Recommended path:

```bash
mkdir -p /opt
cd /opt

# Replace with your repository URL
git clone git@github.com:yourusername/scan-suite.git scan-suite
cd /opt/scan-suite
```

## Step 4: Configure Production Environment

Create production env file:

```bash
cp .env.production.example .env.production
nano .env.production
```

Set/verify at least:

1. `APP_BASE_URL=https://scansuite.co.zw`
2. `API_BASE_URL=https://scansuite.co.zw/api`
3. `CORS_ORIGIN=https://scansuite.co.zw`
4. `NEXT_PUBLIC_API_URL=https://scansuite.co.zw`
5. `NEXT_PUBLIC_APP_URL=https://scansuite.co.zw`
6. `NEXT_PUBLIC_SOCKET_URL=https://scansuite.co.zw`
7. Strong values for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
8. Safe `POSTGRES_PASSWORD`, `S3_ACCESS_KEY`, and `S3_SECRET_KEY`

## Step 5: Deploy

```bash
chmod +x infra/scripts/deploy.sh
./infra/scripts/deploy.sh
```

Or directly:

```bash
docker compose -f infra/compose/docker-compose.production.yml up -d --build
```

## Step 6: Initialize Database (First Deploy Only)

```bash
docker compose -f infra/compose/docker-compose.production.yml exec api npx prisma migrate deploy
docker compose -f infra/compose/docker-compose.production.yml exec api npm run db:seed
```

## Step 7: Verify

```bash
docker compose -f infra/compose/docker-compose.production.yml ps
curl -fsS http://localhost/health/live
```

Open in browser:

1. `http://scansuite.co.zw`
2. `http://www.scansuite.co.zw`

## HTTPS Note

Current Nginx config is HTTP reverse proxy. For HTTPS, either:

1. Put the domain behind Cloudflare proxy and configure SSL mode correctly.
2. Add origin TLS certificates in your Nginx setup.

## Maintenance

```bash
# Logs
docker compose -f infra/compose/docker-compose.production.yml logs -f

# Redeploy
./infra/scripts/deploy.sh

# Stop
docker compose -f infra/compose/docker-compose.production.yml down
```
