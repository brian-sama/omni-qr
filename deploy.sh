#!/bin/bash

# Scan Suite - Non-Docker Deployment Script
# This script automates the deployment process on the VPS.

set -e

# Configuration
APP_DIR="/var/www/scansuite"

echo "🚀 Starting deployment..."

# Navigate to app directory
if [ -d "$APP_DIR" ]; then
    cd "$APP_DIR"
else
    echo "❌ Error: App directory $APP_DIR not found."
    exit 1
fi

# Pull latest changes
echo "📥 Pulling latest changes from git..."
git pull origin main

# Install dependencies (Root and Workspaces)
echo "📦 Installing dependencies..."
npm install

# API Setup
echo "⚙️ Setting up API..."
cd apps/api
npm run db:generate
echo "🔄 Running database migrations..."
npx prisma migrate deploy
echo "🏗️ Building API..."
npm run build
cd ../..

# Web Setup
echo "🏗️ Building Web Frontend..."
cd apps/web
npm run build
cd ../..

# Restart Services with PM2
echo "🔄 Reloading services with PM2..."
pm2 reload ecosystem.config.cjs --env production || pm2 start ecosystem.config.cjs --env production

# Save PM2 state
echo "💾 Saving PM2 state..."
pm2 save

# Nginx Check
echo "🔍 Checking Nginx status..."
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Deployment completed successfully!"
echo "📈 Current PM2 status:"
pm2 status
