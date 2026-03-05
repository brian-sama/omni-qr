# Scan Suite - Contabo VPS Deployment Guide (Non-Docker)

This guide outlines the process for deploying **Scan Suite** to a Contabo VPS (`89.116.26.24`) using a native Node.js setup (PM2) and Nginx as a reverse proxy with HTTPS.

## Prerequisites

- A Contabo VPS running Ubuntu 22.04 or later.
- Domain `scansuite.co.zw` pointing to your VPS IP (`89.116.26.24`).
- Node.js (v18+) and npm installed on the server.
- PostgreSQL installed and running on the server.

---

## 1. Server Preparation

SSH into your VPS:

```bash
ssh root@89.116.26.24
```

Update system and install dependencies:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl nginx certbot python3-certbot-nginx postgresql postgresql-contrib
```

Install Node.js (using NodeSource):

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Install PM2 globally:

```bash
sudo npm install -g pm2
```

---

## 2. Database Setup

Switch to the postgres user and create the database/user:

```bash
sudo -i -u postgres
psql
```

Inside the PostgreSQL prompt:

```sql
CREATE DATABASE scansuite_db;
CREATE USER scansuite_user WITH PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE scansuite_db TO scansuite_user;
\q
exit
```

---

## 3. Clone and Initialize Project

```bash
mkdir -p /var/www
cd /var/www
git clone git@github.com:brian-sama/omni-qr.git scansuite
cd scansuite
npm install
```

---

## 4. Configuration

Create `.env` files for both `apps/api` and `apps/web`.

### API Configuration (`apps/api/.env`)

```bash
DATABASE_URL="postgresql://scansuite_user:your_strong_password@localhost:5432/scansuite_db"
JWT_ACCESS_SECRET="your_access_secret"
JWT_REFRESH_SECRET="your_refresh_secret"
PORT=4000
# Add S3/MinIO config if applicable
```

### Web Configuration (`apps/web/.env`)

```bash
NEXT_PUBLIC_API_URL="https://scansuite.co.zw/api"
PORT=3000
```

---

## 5. Build and Start Services

### API

```bash
cd /var/www/scansuite
npm ci
cd apps/api
npm run db:generate
npx prisma migrate deploy
npm run build
pm2 start dist/index.js --name scansuite-api --env production
```

### Web (Frontend)

```bash
cd /var/www/scansuite/apps/web
npm run build
pm2 start npm --name scansuite-web -- start
```

Save PM2 list and setup startup script:

```bash
pm2 save
pm2 startup
```

---

## 6. Nginx Reverse Proxy & SSL

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/scansuite.co.zw
```

Add the following (Replace `scansuite.co.zw`):

```nginx
server {
    listen 80;
    server_name scansuite.co.zw www.scansuite.co.zw;

    location /api/ {
        proxy_pass http://localhost:4000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and test Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/scansuite.co.zw /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Obtain SSL Certificate:

```bash
sudo certbot --nginx -d scansuite.co.zw -d www.scansuite.co.zw
```

---

## 7. Maintenance

- **View Logs**: `pm2 logs`
- **Restart Services**: `pm2 restart all`
- **Update Project**:

  ```bash
  cd /var/www/scansuite
  git pull
  npm ci
  cd apps/api
  npm run db:generate
  npx prisma migrate deploy
  npm run build
  cd ../web
  npm run build
  pm2 restart all
  ```
