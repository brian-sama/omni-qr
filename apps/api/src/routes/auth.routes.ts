import bcrypt from "bcryptjs";
import { Router } from "express";
import slugify from "slugify";
import { AuditAction, Role } from "@prisma/client";
import { loginSchema, registerSchema } from "@scan-suite/shared";
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

function buildOrgSlug(name: string): string {
  const base = slugify(name, {
    lower: true,
    strict: true,
    trim: true
  }).slice(0, 50);

  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

router.post("/register", validateBody(registerSchema), async (request, response, next) => {
  try {
    const { name, email, password } = request.body;

    const existingUser = await prisma.user.findUnique({
      where: {
        organizationId_email: {
          email,
          organizationId: "placeholder" // This @@unique constraint is actually [organizationId, email]
        }
      }
    });

    // Wait, let's just check if email exists globally for now to simplify,
    // or better, check if the email is already used in ANY organization if that's the intent.
    // The schema says @@unique([organizationId, email]), so a user can belong to multiple orgs theoretically?
    // But our login logic only looks for email.
    const userExists = await prisma.user.findFirst({
      where: { email }
    });

    if (userExists) {
      response.status(409).json({ error: "User with this email already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const slug = buildOrgSlug(name);

    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name,
          slug,
          primaryColor: "#1B4DFF"
        }
      });

      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: Role.OWNER,
          organizationId: org.id
        }
      });

      return { user, org };
    });

    const accessToken = signAccessToken({
      userId: result.user.id,
      organizationId: result.org.id,
      role: result.user.role,
      email: result.user.email
    });

    const refreshToken = signRefreshToken({
      userId: result.user.id,
      organizationId: result.org.id,
      sessionId: "initial_session" // We could create a real session here
    });

    setAuthCookies(response, accessToken, refreshToken);

    await writeAuditLog({
      organizationId: result.org.id,
      actorUserId: result.user.id,
      action: AuditAction.AUTH_REGISTER,
      entityType: "user",
      entityId: result.user.id,
      metadata: { email: result.user.email }
    });

    response.status(201).json({
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        organizationId: result.org.id
      },
      organization: result.org
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", validateBody(loginSchema), async (request, response, next) => {
  try {
    const { email, password } = request.body;

    const user = await prisma.user.findFirst({
      where: { email },
      include: { organization: true }
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      response.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const accessToken = signAccessToken({
      userId: user.id,
      organizationId: user.organizationId,
      role: user.role,
      email: user.email
    });

    const refreshToken = signRefreshToken({
      userId: user.id,
      organizationId: user.organizationId,
      sessionId: "login_session"
    });

    setAuthCookies(response, accessToken, refreshToken);

    await writeAuditLog({
      organizationId: user.organizationId,
      actorUserId: user.id,
      action: AuditAction.AUTH_LOGIN,
      entityType: "user",
      entityId: user.id
    });

    response.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId
      },
      organization: user.organization
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

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { organization: true }
    });

    if (!user || user.organizationId !== payload.organizationId) {
      response.status(401).json({ error: "User or organization mismatch" });
      return;
    }

    const newAccessToken = signAccessToken({
      userId: user.id,
      organizationId: user.organizationId,
      role: user.role,
      email: user.email
    });

    const newRefreshToken = signRefreshToken({
      userId: user.id,
      organizationId: user.organizationId,
      sessionId: payload.sessionId
    });

    setAuthCookies(response, newAccessToken, newRefreshToken);

    response.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId
      },
      organization: user.organization
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
    const user = await prisma.user.findUnique({
      where: { id: request.user!.id },
      include: { organization: true }
    });

    if (!user) {
      response.status(404).json({ error: "User not found" });
      return;
    }

    response.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId
      },
      organization: user.organization
    });
  } catch (error) {
    next(error);
  }
});

export const authRouter = router;

