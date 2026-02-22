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

    const existingUser = await prisma.user.findFirst({
      where: {
        email
      }
    });

    if (existingUser) {
      response.status(409).json({ error: "Email already in use" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.$transaction(async (transaction) => {
      const organization = await transaction.organization.create({
        data: {
          name: `${name}'s Organization`
        }
      });

      const createdUser = await transaction.user.create({
        data: {
          organizationId: organization.id,
          email,
          passwordHash,
          role: "OWNER"
        }
      });

      return {
        ...createdUser,
        organization
      };
    });

    const sessionExpiresAt = new Date(Date.now() + ttlToMs(env.REFRESH_TOKEN_TTL));
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: "pending",
        expiresAt: sessionExpiresAt,
        ipAddress: request.ip,
        userAgent: request.get("user-agent")
      }
    });

    const accessToken = signAccessToken({
      userId: user.id,
      organizationId: user.organizationId,
      role: user.role,
      email: user.email
    });

    const refreshToken = signRefreshToken({
      userId: user.id,
      organizationId: user.organizationId,
      sessionId: session.id
    });

    await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: hashToken(refreshToken)
      }
    });

    setAuthCookies(response, accessToken, refreshToken);

    await writeAuditLog({
      organizationId: user.organizationId,
      actorUserId: user.id,
      action: AuditAction.AUTH_REGISTER,
      entityType: "user",
      entityId: user.id,
      metadata: {
        email
      }
    });

    response.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId
      },
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        primaryColor: user.organization.primaryColor,
        logoUrl: user.organization.logoUrl
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", validateBody(loginSchema), async (request, response, next) => {
  try {
    const { email, password } = request.body;

    const user = await prisma.user.findFirst({
      where: {
        email
      },
      include: {
        organization: true
      }
    });

    if (!user) {
      response.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      response.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const sessionExpiresAt = new Date(Date.now() + ttlToMs(env.REFRESH_TOKEN_TTL));

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: "pending",
        expiresAt: sessionExpiresAt,
        ipAddress: request.ip,
        userAgent: request.get("user-agent")
      }
    });

    const accessToken = signAccessToken({
      userId: user.id,
      organizationId: user.organizationId,
      role: user.role,
      email: user.email
    });

    const refreshToken = signRefreshToken({
      userId: user.id,
      organizationId: user.organizationId,
      sessionId: session.id
    });

    await prisma.session.update({
      where: {
        id: session.id
      },
      data: {
        refreshTokenHash: hashToken(refreshToken)
      }
    });

    setAuthCookies(response, accessToken, refreshToken);

    await writeAuditLog({
      organizationId: user.organizationId,
      actorUserId: user.id,
      action: AuditAction.AUTH_LOGIN,
      entityType: "session",
      entityId: session.id,
      metadata: {
        ipAddress: request.ip,
        userAgent: request.get("user-agent")
      }
    });

    response.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId
      },
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        primaryColor: user.organization.primaryColor,
        logoUrl: user.organization.logoUrl
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

    const session = await prisma.session.findFirst({
      where: {
        id: payload.sessionId,
        userId: payload.userId,
        revokedAt: null,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        user: {
          include: {
            organization: true
          }
        }
      }
    });

    if (!session) {
      response.status(401).json({ error: "Invalid refresh token" });
      return;
    }

    if (session.refreshTokenHash !== hashToken(refreshToken)) {
      await prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() }
      });

      response.status(401).json({ error: "Invalid refresh token" });
      return;
    }

    const newAccessToken = signAccessToken({
      userId: session.user.id,
      organizationId: session.user.organizationId,
      role: session.user.role,
      email: session.user.email
    });

    const newRefreshToken = signRefreshToken({
      userId: session.user.id,
      organizationId: session.user.organizationId,
      sessionId: session.id
    });

    await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: hashToken(newRefreshToken),
        expiresAt: new Date(Date.now() + ttlToMs(env.REFRESH_TOKEN_TTL))
      }
    });

    setAuthCookies(response, newAccessToken, newRefreshToken);

    await writeAuditLog({
      organizationId: session.user.organizationId,
      actorUserId: session.user.id,
      action: AuditAction.AUTH_REFRESH,
      entityType: "session",
      entityId: session.id
    });

    response.status(200).json({
      user: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
        organizationId: session.user.organizationId
      },
      organization: {
        id: session.user.organization.id,
        name: session.user.organization.name,
        primaryColor: session.user.organization.primaryColor,
        logoUrl: session.user.organization.logoUrl
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", async (request, response, next) => {
  try {
    const refreshToken = request.cookies?.[COOKIE_NAMES.refresh];

    if (refreshToken && typeof refreshToken === "string") {
      try {
        const payload = verifyRefreshToken(refreshToken);

        await prisma.session.updateMany({
          where: {
            id: payload.sessionId,
            userId: payload.userId,
            revokedAt: null
          },
          data: {
            revokedAt: new Date()
          }
        });

        await writeAuditLog({
          organizationId: payload.organizationId,
          actorUserId: payload.userId,
          action: AuditAction.AUTH_LOGOUT,
          entityType: "session",
          entityId: payload.sessionId
        });
      } catch {
        // Ignore invalid refresh token on logout.
      }
    }

    response.clearCookie(COOKIE_NAMES.access, buildAccessCookieOptions());
    response.clearCookie(COOKIE_NAMES.refresh, buildRefreshCookieOptions());
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, async (request, response, next) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: request.user?.id,
        organizationId: request.user?.organizationId
      },
      include: {
        organization: true
      }
    });

    if (!user) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }

    response.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId
      },
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        primaryColor: user.organization.primaryColor,
        logoUrl: user.organization.logoUrl
      }
    });
  } catch (error) {
    next(error);
  }
});

export const authRouter = router;

