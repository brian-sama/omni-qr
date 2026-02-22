import type { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { COOKIE_NAMES } from "../utils/http";
import {
  verifyAccessToken,
  verifyPublicToken,
  type AccessTokenPayload
} from "../services/token.service";

function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    return null;
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

function readAccessToken(request: Request): string | null {
  const cookieToken = request.cookies?.[COOKIE_NAMES.access];
  if (typeof cookieToken === "string" && cookieToken.length > 0) {
    return cookieToken;
  }

  return extractBearerToken(request);
}

function readPublicToken(request: Request): string | null {
  const cookieToken = request.cookies?.[COOKIE_NAMES.publicAccess];
  if (typeof cookieToken === "string" && cookieToken.length > 0) {
    return cookieToken;
  }

  const authToken = extractBearerToken(request);
  return authToken;
}

async function hydrateUserFromPayload(payload: AccessTokenPayload) {
  const user = await prisma.user.findFirst({
    where: {
      id: payload.userId,
      organizationId: payload.organizationId
    },
    select: {
      id: true,
      email: true,
      organizationId: true,
      role: true
    }
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    organizationId: user.organizationId,
    role: user.role as Role
  };
}

export async function requireAuth(request: Request, response: Response, next: NextFunction): Promise<void> {
  const token = readAccessToken(request);

  if (!token) {
    response.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const payload = verifyAccessToken(token);

    if (payload.type !== "access") {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await hydrateUserFromPayload(payload);

    if (!user) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }

    request.user = user;
    next();
  } catch {
    response.status(401).json({ error: "Unauthorized" });
  }
}

export function attachPublicAccess(request: Request, _response: Response, next: NextFunction): void {
  const token = readPublicToken(request);

  if (!token) {
    next();
    return;
  }

  try {
    const payload = verifyPublicToken(token);

    if (payload.type !== "public") {
      next();
      return;
    }

    request.publicAccess = {
      meetingId: payload.meetingId,
      organizationId: payload.organizationId
    };
  } catch {
    request.publicAccess = undefined;
  }

  next();
}

