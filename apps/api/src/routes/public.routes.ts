import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { AuditAction, FileVersionStatus, MeetingStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { attachPublicAccess } from "../middleware/auth";
import { evaluateAccessPolicy } from "../services/access-policy.service";
import { writeAuditLog } from "../services/audit.service";
import { createPublicDownloadUrl } from "../services/file.service";
import { emitMeetingEvent } from "../realtime/socket";
import { signPublicToken } from "../services/token.service";
import { buildPublicCookieOptions, COOKIE_NAMES } from "../utils/http";

const verifyPasswordSchema = z.object({
  password: z.string().min(1)
});

const router = Router();

router.use(attachPublicAccess);

router.get("/meetings/:slug", async (request, response, next) => {
  try {
    const meeting = await prisma.meeting.findUnique({
      where: {
        slug: request.params.slug
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            primaryColor: true
          }
        },
        accessPolicy: true,
        files: {
          orderBy: {
            updatedAt: "desc"
          },
          include: {
            versions: {
              where: {
                status: FileVersionStatus.READY
              },
              orderBy: {
                version: "desc"
              },
              take: 1
            }
          }
        }
      }
    });

    if (!meeting) {
      response.status(404).json({ error: "Meeting not found" });
      return;
    }

    if (
      meeting.status === MeetingStatus.EXPIRED ||
      (meeting.expiresAt && new Date() > meeting.expiresAt)
    ) {
      response.status(410).json({ error: "Meeting has expired" });
      return;
    }

    if (meeting.status === MeetingStatus.DRAFT || meeting.status === MeetingStatus.ARCHIVED) {
      response.status(403).json({ error: "Meeting is not publicly available" });
      return;
    }

    const hasPasswordBypass = request.publicAccess?.meetingId === meeting.id;

    const policyDecision = evaluateAccessPolicy({
      policy: meeting.accessPolicy,
      bypassPassword: hasPasswordBypass
    });

    if (!policyDecision.allowed && policyDecision.requiresPassword) {
      response.status(401).json({
        meeting: {
          id: meeting.id,
          slug: meeting.slug,
          title: meeting.title,
          description: meeting.description,
          expiresAt: meeting.expiresAt,
          accessType: meeting.accessPolicy?.accessType ?? "PUBLIC"
        },
        organization: meeting.organization,
        requiresPassword: true
      });
      return;
    }

    if (!policyDecision.allowed) {
      response.status(403).json({ error: policyDecision.reason ?? "Access denied" });
      return;
    }

    await prisma.scanEvent.create({
      data: {
        organizationId: meeting.organizationId,
        meetingId: meeting.id,
        ipAddress: request.ip,
        device: request.get("user-agent") ?? null
      }
    });

    const scanCount = await prisma.scanEvent.count({
      where: {
        meetingId: meeting.id
      }
    });

    emitMeetingEvent(meeting.id, "scan.updated", {
      meetingId: meeting.id,
      scanCount,
      timestamp: new Date().toISOString()
    });

    response.status(200).json({
      meeting: {
        id: meeting.id,
        slug: meeting.slug,
        title: meeting.title,
        description: meeting.description,
        expiresAt: meeting.expiresAt,
        accessType: meeting.accessPolicy?.accessType ?? "PUBLIC"
      },
      organization: meeting.organization,
      scanCount,
      files: meeting.files
        .filter((file) => file.versions[0])
        .map((file) => ({
          id: file.id,
          name: file.name,
          mimeType: file.versions[0].mimeType,
          size: file.versions[0].size,
          createdAt: file.createdAt,
          updatedAt: file.updatedAt
        }))
    });
  } catch (error) {
    next(error);
  }
});

router.post("/meetings/:slug/verify", async (request, response, next) => {
  try {
    const parsed = verifyPasswordSchema.safeParse(request.body);

    if (!parsed.success) {
      response.status(400).json({ error: "Password is required" });
      return;
    }

    const meeting = await prisma.meeting.findUnique({
      where: {
        slug: request.params.slug
      },
      include: {
        accessPolicy: true
      }
    });

    if (!meeting) {
      response.status(404).json({ error: "Meeting not found" });
      return;
    }

    if (meeting.accessPolicy?.accessType !== "PASSWORD" || !meeting.accessPolicy.passwordHash) {
      response.status(400).json({ error: "Meeting is not password protected" });
      return;
    }

    const passwordMatches = await bcrypt.compare(parsed.data.password, meeting.accessPolicy.passwordHash);

    if (!passwordMatches) {
      response.status(401).json({ error: "Invalid password" });
      return;
    }

    const token = signPublicToken({
      meetingId: meeting.id,
      organizationId: meeting.organizationId
    });

    response.cookie(COOKIE_NAMES.publicAccess, token, buildPublicCookieOptions());

    await writeAuditLog({
      organizationId: meeting.organizationId,
      meetingId: meeting.id,
      action: AuditAction.PUBLIC_ACCESS_VERIFIED,
      entityType: "meeting",
      entityId: meeting.id,
      metadata: {
        ipAddress: request.ip,
        userAgent: request.get("user-agent")
      }
    });

    response.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get("/files/:fileId/access-url", async (request, response, next) => {
  try {
    if (!request.publicAccess) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }

    const file = await prisma.file.findFirst({
      where: {
        id: request.params.fileId,
        organizationId: request.publicAccess.organizationId,
        meetingId: request.publicAccess.meetingId
      },
      include: {
        meeting: {
          include: {
            accessPolicy: true
          }
        }
      }
    });

    if (!file) {
      response.status(404).json({ error: "File not found" });
      return;
    }

    const policyDecision = evaluateAccessPolicy({
      policy: file.meeting.accessPolicy,
      bypassPassword: true
    });

    if (!policyDecision.allowed) {
      response.status(403).json({ error: "Access denied" });
      return;
    }

    const result = await createPublicDownloadUrl(
      request.publicAccess.organizationId,
      request.publicAccess.meetingId,
      request.params.fileId
    );

    await writeAuditLog({
      organizationId: request.publicAccess.organizationId,
      meetingId: request.publicAccess.meetingId,
      action: AuditAction.PUBLIC_FILE_ACCESS,
      entityType: "file",
      entityId: request.params.fileId,
      metadata: {
        ipAddress: request.ip,
        userAgent: request.get("user-agent")
      }
    });

    response.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export const publicRouter = router;

