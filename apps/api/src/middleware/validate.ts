import { z } from "zod";
import type { NextFunction, Request, Response } from "express";

export function validateBody(schema: z.ZodTypeAny) {
  return (request: Request, response: Response, next: NextFunction): void => {
    const result = schema.safeParse(request.body);

    if (!result.success) {
      response.status(400).json({
        error: "Validation failed",
        issues: result.error.flatten()
      });
      return;
    }

    request.body = result.data;
    next();
  };
}

