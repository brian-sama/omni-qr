import pino from "pino";
import pinoHttp from "pino-http";
import { randomUUID } from "node:crypto";
import { env } from "../config/env";

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie", "response.headers['set-cookie']"],
    remove: true
  }
});

export const requestLogger = pinoHttp({
  logger,
  genReqId: (request, response) => {
    const incomingId = request.headers["x-request-id"];

    if (typeof incomingId === "string" && incomingId.length > 0) {
      response.setHeader("x-request-id", incomingId);
      return incomingId;
    }

    const requestId = randomUUID();
    response.setHeader("x-request-id", requestId);
    return requestId;
  },
  customLogLevel: (_, response, error) => {
    if (error || response.statusCode >= 500) {
      return "error";
    }

    if (response.statusCode >= 400) {
      return "warn";
    }

    return "info";
  }
});

