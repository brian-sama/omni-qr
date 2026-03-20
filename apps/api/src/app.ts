import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { logger, requestLogger } from "./lib/logger";
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

  // Diagnostic log to see exactly what Express receives
  app.use((req, _res, next) => {
    logger.debug({ method: req.method, url: req.url, path: req.path }, "API Request received");
    next();
  });

  app.use("/health", healthRouter);

  // Versioned API Router
  const apiV1 = express.Router();
  apiV1.use("/auth", authRateLimiter, authRouter);
  apiV1.use("/meetings", meetingRouter);
  apiV1.use("/files", fileRouter);
  apiV1.use("/public", publicRateLimiter, publicRouter);
  apiV1.use("/organization", organizationRouter);
  apiV1.use("/analytics", analyticsRouter);

  // Mount at both paths to be resilient to Nginx configuration differences
  app.use("/api/v1", apiV1);
  app.use("/v1", apiV1);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

