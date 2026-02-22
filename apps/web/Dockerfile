FROM node:22-alpine AS base
WORKDIR /workspace

COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci

COPY apps/web apps/web
COPY packages/shared packages/shared

RUN npm run build --workspace @omniqr/web

FROM node:22-alpine AS runner
WORKDIR /workspace

ENV NODE_ENV=production

COPY --from=base /workspace/package.json /workspace/package-lock.json /workspace/tsconfig.base.json ./
COPY --from=base /workspace/node_modules ./node_modules
COPY --from=base /workspace/apps/web/package.json apps/web/package.json
COPY --from=base /workspace/apps/web/.next apps/web/.next
COPY --from=base /workspace/apps/web/public apps/web/public
COPY --from=base /workspace/apps/web/next.config.mjs apps/web/next.config.mjs
COPY --from=base /workspace/packages/shared packages/shared

EXPOSE 3000

CMD ["npm", "run", "start", "--workspace", "@omniqr/web"]

