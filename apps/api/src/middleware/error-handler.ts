import type { NextFunction, Request, Response } from "express";
import * as Sentry from "@sentry/node";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { logger } from "../lib/logger";

export function notFoundHandler(_request: Request, response: Response): void {
  response.status(404).json({ error: "Not found" });
}

export function errorHandler(error: unknown, request: Request, response: Response, _next: NextFunction): void {
  logger.error({ err: error, requestId: request.id }, "Unhandled API error");
  Sentry.captureException(error);

  if (error instanceof ZodError) {
    response.status(400).json({
      error: "Validation error",
      issues: error.flatten()
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    response.status(400).json({
      error: error.message,
      code: error.code
    });
    return;
  }

  if (error instanceof Error) {
    response.status(500).json({ error: error.message });
    return;
  }

  response.status(500).json({ error: "Internal server error" });
}

