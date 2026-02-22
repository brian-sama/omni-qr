import http from "node:http";
import * as Sentry from "@sentry/node";
import { env } from "./config/env";
import { createApp } from "./app";
import { createSocketServer } from "./realtime/socket";
import { logger } from "./lib/logger";
import { prisma } from "./lib/prisma";

if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    tracesSampleRate: env.NODE_ENV === "production" ? 0.1 : 1.0,
    environment: env.NODE_ENV
  });
}

const app = createApp();
const server = http.createServer(app);
createSocketServer(server);

server.listen(env.API_PORT, "0.0.0.0", () => {
  logger.info({ port: env.API_PORT }, "omniQR API server listening");
});

async function shutdown(signal: string) {
  logger.info({ signal }, "Received shutdown signal");

  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });

  setTimeout(() => {
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

