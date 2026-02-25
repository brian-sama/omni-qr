# Scan Suite - Contabo VPS Deployment Guide (Let's Encrypt)

This guide deploys **Scan Suite** to your Contabo VPS (`89.116.26.24`) and sets up HTTPS for:

1. `scansuite.co.zw`
2. `www.scansuite.co.zw`

Repository:

```bash
git@github.com:brian-sama/omni-qr.git
```

## 1) VPS bootstrap

SSH into your server:

```bash
ssh root@89.116.26.24
```

Install system packages and Docker:

```bash
apt update && apt upgrade -y
apt install -y git curl ca-certificates ufw

curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

docker --version
docker compose version
```

Configure firewall:

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

## 2) DNS cutover

At your DNS provider, configure:

1. `A @ -> 89.116.26.24`
2. `A www -> 89.116.26.24`

Verify:

```bash
nslookup scansuite.co.zw
nslookup www.scansuite.co.zw
```

Both should resolve to `89.116.26.24`.

## 3) Clone project

```bash
mkdir -p /opt
cd /opt
git clone git@github.com:brian-sama/omni-qr.git scan-suite
cd /opt/scan-suite
```

## 4) Configure production env

```bash
cp .env.production.example .env.production
nano .env.production
```

Set strong secrets:

1. `JWT_ACCESS_SECRET`
2. `JWT_REFRESH_SECRET`
3. `POSTGRES_PASSWORD`
4. `S3_ACCESS_KEY`
5. `S3_SECRET_KEY`

Domain values should be:

1. `APP_BASE_URL=https://scansuite.co.zw`
2. `API_BASE_URL=https://scansuite.co.zw/api`
3. `CORS_ORIGIN=https://scansuite.co.zw`
4. `NEXT_PUBLIC_API_URL=https://scansuite.co.zw`
5. `NEXT_PUBLIC_APP_URL=https://scansuite.co.zw`
6. `NEXT_PUBLIC_SOCKET_URL=https://scansuite.co.zw`

## 5) First deployment (HTTP bootstrap)

```bash
chmod +x infra/scripts/deploy.sh
chmod +x infra/scripts/setup-letsencrypt.sh
chmod +x infra/scripts/renew-letsencrypt.sh

./infra/scripts/deploy.sh
```

`deploy.sh` behavior:

1. Always pulls infrastructure images (`nginx`, `postgres`, `minio`, `minio-init`)
2. Pulls `api`/`web` images only when `API_IMAGE` and/or `WEB_IMAGE` env vars are set
3. If app image vars are not set, `api` and `web` are built from source on the VPS

If you want to use GHCR images instead of local VPS builds:

```bash
export API_IMAGE=ghcr.io/<owner>/scansuite-api:latest
export WEB_IMAGE=ghcr.io/<owner>/scansuite-web:latest
echo "<ghcr-pat>" | docker login ghcr.io -u "<ghcr-user>" --password-stdin
./infra/scripts/deploy.sh
```

Run first-time DB setup:

```bash
docker compose -f infra/compose/docker-compose.production.yml exec api npx prisma migrate deploy
docker compose -f infra/compose/docker-compose.production.yml exec api npm run db:seed
```

## 6) Issue Let's Encrypt certificate and enable HTTPS

Run:

```bash
./infra/scripts/setup-letsencrypt.sh you@example.com
```

What this script does:

1. Verifies DNS points to `89.116.26.24`
2. Deploys HTTP bootstrap Nginx config with ACME challenge path
3. Requests certificate for both domains via webroot mode
4. Switches Nginx to TLS config and reloads services

## 7) Configure automatic renewal

Add cron job:

```bash
crontab -e
```

Use:

```cron
0 3 * * * /opt/scan-suite/infra/scripts/renew-letsencrypt.sh >> /var/log/scansuite-cert-renew.log 2>&1
```

## 8) Validate production

```bash
docker compose -f infra/compose/docker-compose.production.yml ps
curl -fsS http://localhost/health/live
curl -I http://scansuite.co.zw
curl -I https://scansuite.co.zw
curl -I https://www.scansuite.co.zw
```

Expected:

1. `http://scansuite.co.zw` -> `301` to `https://scansuite.co.zw`
2. `https://scansuite.co.zw` -> `200`
3. `https://www.scansuite.co.zw` -> `301` to `https://scansuite.co.zw`

## 9) Operations

```bash
# Logs
docker compose -f infra/compose/docker-compose.production.yml logs -f

# Redeploy
./infra/scripts/deploy.sh

# Stop stack
docker compose -f infra/compose/docker-compose.production.yml down

# Run backup
./infra/scripts/backup.sh
```

## 10) Rollback

```bash
cd /opt/scan-suite
git log --oneline -n 5
git checkout <previous_commit>
./infra/scripts/deploy.sh
```

If database rollback is needed, restore from your latest backup before re-opening traffic.
