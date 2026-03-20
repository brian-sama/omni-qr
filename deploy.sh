#!/bin/bash

# Scan Suite - Non-Docker Deployment Script
# This script automates the deployment process on the VPS.

set -e

# Configuration
# Get the directory where the script is located
APP_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

echo "🚀 Starting deployment in $APP_DIR..."

# Navigate to app directory
cd "$APP_DIR" || { echo "❌ Error: Could not change to directory $APP_DIR"; exit 1; }

# Pull latest changes
echo "📥 Syncing with latest changes from git..."
# Forcing the server to match the remote branch (defaulting to main)
# This discards any local changes on the server, which is best for production-ready deployments.
git fetch origin main
git reset --hard origin/main

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
