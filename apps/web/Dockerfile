# Build Stage
FROM node:22-slim AS builder

WORKDIR /app

# Copy manifests
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build Web
RUN npm run build -w @scan-suite/web

# Production Stage
FROM node:22-slim

WORKDIR /app

# Copy manifests
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/shared/package*.json ./packages/shared/

# Install production dependencies
RUN npm install --omit=dev

# Copy build output and necessary files
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/next.config.mjs ./apps/web/
COPY --from=builder /app/packages/shared ./packages/shared

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start the application
CMD ["npm", "run", "start", "-w", "@scan-suite/web"]
