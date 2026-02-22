FROM node:22-alpine AS base
WORKDIR /workspace

COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci

COPY apps/api apps/api
COPY packages/shared packages/shared

RUN npm run db:generate --workspace @omniqr/api
RUN npm run build --workspace @omniqr/api

FROM node:22-alpine AS runner
WORKDIR /workspace

ENV NODE_ENV=production

COPY --from=base /workspace/package.json /workspace/package-lock.json /workspace/tsconfig.base.json ./
COPY --from=base /workspace/node_modules ./node_modules
COPY --from=base /workspace/apps/api/package.json apps/api/package.json
COPY --from=base /workspace/apps/api/dist apps/api/dist
COPY --from=base /workspace/apps/api/prisma apps/api/prisma
COPY --from=base /workspace/packages/shared packages/shared

EXPOSE 4000

CMD ["sh", "-c", "npm run db:migrate --workspace @omniqr/api && npm run start --workspace @omniqr/api"]

