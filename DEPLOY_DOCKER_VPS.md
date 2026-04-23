# Scan Suite VPS Deployment

This stack is set up to run behind your existing host Nginx on:

- Web: `127.0.0.1:3100`
- API: `127.0.0.1:4100`

Those ports are a good fit for your VPS because your port list already shows `3000`, `3001`, `3002`, `5433`, `5434`, `8001`, `8002`, `8005`, `8006`, `8501`, and `8502` in use, while `3100` and `4100` are free.

Postgres and MinIO stay private inside Docker and are not exposed on public ports.

## 1. Prepare the VPS

```bash
sudo mkdir -p /opt/scansuite
sudo chown -R "$USER":"$USER" /opt/scansuite
cd /opt/scansuite
git clone <your-repo-url> .
cp .env.production.example .env.production
```

Edit `.env.production` and set real values for:

- `POSTGRES_PASSWORD`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `S3_ACCESS_KEY`
- `S3_SECRET_KEY`
- `MINIO_ROOT_USER`
- `MINIO_ROOT_PASSWORD`
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`
- `APP_BASE_URL`
- `CORS_ORIGIN`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SOCKET_URL`

Keep `DATABASE_URL` pointing at the Docker service name `postgres`.

## 2. Start the stack

```bash
cd /opt/scansuite
chmod +x infra/scripts/vps-deploy.sh
./infra/scripts/vps-deploy.sh
```

If you want the first owner account seeded during deployment:

```bash
cd /opt/scansuite
RUN_SEED=true ./infra/scripts/vps-deploy.sh
```

## 3. Check containers

```bash
cd /opt/scansuite
docker compose ps
docker compose logs api --tail=100
docker compose logs web --tail=100
docker compose logs postgres --tail=100
docker compose logs minio --tail=100
```

## 4. Configure host Nginx

Copy `infra/nginx/nginx.ssl.conf` to your VPS Nginx site config and keep the upstreams:

- `127.0.0.1:3100` for the web app
- `127.0.0.1:4100` for the API

Example:

```bash
sudo cp /opt/scansuite/infra/nginx/nginx.ssl.conf /etc/nginx/sites-available/scansuite.conf
sudo ln -sf /etc/nginx/sites-available/scansuite.conf /etc/nginx/sites-enabled/scansuite.conf
sudo nginx -t
sudo systemctl reload nginx
```

If your certificates are not in place yet, start from `infra/nginx/nginx.bootstrap.conf`, issue the cert, then switch to `nginx.ssl.conf`.

## 5. Database operations

Migrations are applied automatically when the `api` container starts.

Manual commands:

```bash
cd /opt/scansuite
docker compose run --rm --profile ops migrate
docker compose run --rm --profile ops seed
```

## 6. Updating later

```bash
cd /opt/scansuite
git pull
./infra/scripts/vps-deploy.sh
```

## 7. Backups

Database dump:

```bash
cd /opt/scansuite
docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > scansuite-$(date +%F).sql
```

MinIO data is stored in the Docker volume `minio_data`, and Postgres data is stored in `postgres_data`.
