import bcrypt from "bcryptjs";
import { Router } from "express";
import { AuditAction } from "@prisma/client";
import { loginSchema, registerSchema } from "@omniqr/shared";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from "../services/token.service";
import {
  buildAccessCookieOptions,
  buildRefreshCookieOptions,
  COOKIE_NAMES
} from "../utils/http";
import { env } from "../config/env";
import { ttlToMs } from "../utils/duration";
import { writeAuditLog } from "../services/audit.service";

const router = Router();

function setAuthCookies(response: any, accessToken: string, refreshToken: string) {
  response.cookie(COOKIE_NAMES.access, accessToken, buildAccessCookieOptions());
  response.cookie(COOKIE_NAMES.refresh, refreshToken, buildRefreshCookieOptions());
}

router.post("/register", validateBody(registerSchema), async (request, response, next) => {
  try {
    const { name, email, password } = request.body;

    const mockOrgId = "org_12345";
    const mockUserId = "user_12345";
    const mockSessionId = "session_12345";

    const accessToken = signAccessToken({
      userId: mockUserId,
      organizationId: mockOrgId,
      role: "OWNER",
      email
    });

    const refreshToken = signRefreshToken({
      userId: mockUserId,
      organizationId: mockOrgId,
      sessionId: mockSessionId
    });

    setAuthCookies(response, accessToken, refreshToken);

    response.status(201).json({
      user: {
        id: mockUserId,
        email,
        role: "OWNER",
        organizationId: mockOrgId
      },
      organization: {
        id: mockOrgId,
        name: `${name}'s Organization`,
        primaryColor: "#0F172A",
        logoUrl: null
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", validateBody(loginSchema), async (request, response, next) => {
  try {
    const { email } = request.body;

    const mockOrgId = "org_12345";
    const mockUserId = "user_12345";
    const mockSessionId = "session_12345";

    const accessToken = signAccessToken({
      userId: mockUserId,
      organizationId: mockOrgId,
      role: "OWNER",
      email
    });

    const refreshToken = signRefreshToken({
      userId: mockUserId,
      organizationId: mockOrgId,
      sessionId: mockSessionId
    });

    setAuthCookies(response, accessToken, refreshToken);

    response.status(200).json({
      user: {
        id: mockUserId,
        email,
        role: "OWNER",
        organizationId: mockOrgId
      },
      organization: {
        id: mockOrgId,
        name: `Demo Organization`,
        primaryColor: "#0F172A",
        logoUrl: null
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post("/refresh", async (request, response, next) => {
  try {
    const refreshTokenFromCookie = request.cookies?.[COOKIE_NAMES.refresh];
    const refreshToken =
      typeof refreshTokenFromCookie === "string" && refreshTokenFromCookie.length > 0
        ? refreshTokenFromCookie
        : request.body?.refreshToken;

    if (!refreshToken || typeof refreshToken !== "string") {
      response.status(401).json({ error: "Missing refresh token" });
      return;
    }

    const payload = verifyRefreshToken(refreshToken);

    if (payload.type !== "refresh") {
      response.status(401).json({ error: "Invalid refresh token" });
      return;
    }

    const mockOrgId = "org_12345";
    const mockUserId = "user_12345";
    const mockSessionId = payload.sessionId || "session_12345";

    const newAccessToken = signAccessToken({
      userId: mockUserId,
      organizationId: mockOrgId,
      role: "OWNER",
      email: "demo@example.com"
    });

    const newRefreshToken = signRefreshToken({
      userId: mockUserId,
      organizationId: mockOrgId,
      sessionId: mockSessionId
    });

    setAuthCookies(response, newAccessToken, newRefreshToken);

    response.status(200).json({
      user: {
        id: mockUserId,
        email: "demo@example.com",
        role: "OWNER",
        organizationId: mockOrgId
      },
      organization: {
        id: mockOrgId,
        name: `Demo Organization`,
        primaryColor: "#0F172A",
        logoUrl: null
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", async (request, response, next) => {
  try {
    response.clearCookie(COOKIE_NAMES.access, buildAccessCookieOptions());
    response.clearCookie(COOKIE_NAMES.refresh, buildRefreshCookieOptions());
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, async (request, response, next) => {
  try {
    const mockOrgId = "org_12345";
    const mockUserId = "user_12345";

    response.status(200).json({
      user: {
        id: mockUserId,
        email: request.user?.email || "demo@example.com",
        role: "OWNER",
        organizationId: mockOrgId
      },
      organization: {
        id: mockOrgId,
        name: `Demo Organization`,
        primaryColor: "#0F172A",
        logoUrl: null
      }
    });
  } catch (error) {
    next(error);
  }
});

export const authRouter = router;

