import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { requestLogger } from "./lib/logger";
import { authRouter } from "./routes/auth.routes";
import { fileRouter } from "./routes/file.routes";
import { meetingRouter } from "./routes/meeting.routes";
import { publicRouter } from "./routes/public.routes";
import { healthRouter } from "./routes/health.routes";
import { organizationRouter } from "./routes/organization.routes";
import { analyticsRouter } from "./routes/analytics.routes";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";

export function createApp() {
  const app = express();

  app.set("trust proxy", true);
  app.use(requestLogger);
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true
    })
  );
  app.use(helmet());
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  const authRateLimiter = rateLimit({
    windowMs: 60_000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false
  });

  const publicRateLimiter = rateLimit({
    windowMs: 60_000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false
  });

  app.use("/health", healthRouter);
  app.use("/api/v1/auth", authRateLimiter, authRouter);
  app.use("/api/v1/meetings", meetingRouter);
  app.use("/api/v1/files", fileRouter);
  app.use("/api/v1/public", publicRateLimiter, publicRouter);
  app.use("/api/v1/organization", organizationRouter);
  app.use("/api/v1/analytics", analyticsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

