import { Router } from "express";
import { z } from "zod";
import { AuditAction } from "@prisma/client";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { writeAuditLog } from "../services/audit.service";

const updateOrganizationSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  primaryColor: z.string().regex(/^#([0-9a-fA-F]{6})$/, "Use a hex color like #1B4DFF").optional(),
  logoUrl: z.string().url().nullable().optional()
});

const router = Router();

router.get("/", requireAuth, async (request, response, next) => {
  try {
    const organization = await prisma.organization.findUnique({
      where: {
        id: request.user!.organizationId
      }
    });

    if (!organization) {
      response.status(404).json({ error: "Organization not found" });
      return;
    }

    response.status(200).json({ organization });
  } catch (error) {
    next(error);
  }
});

router.patch("/", requireAuth, async (request, response, next) => {
  try {
    const parsed = updateOrganizationSchema.safeParse(request.body);

    if (!parsed.success) {
      response.status(400).json({
        error: "Validation failed",
        issues: parsed.error.flatten()
      });
      return;
    }

    const organization = await prisma.organization.update({
      where: {
        id: request.user!.organizationId
      },
      data: {
        name: parsed.data.name,
        primaryColor: parsed.data.primaryColor,
        logoUrl: parsed.data.logoUrl
      }
    });

    await writeAuditLog({
      organizationId: organization.id,
      actorUserId: request.user!.id,
      action: AuditAction.ORGANIZATION_UPDATE,
      entityType: "organization",
      entityId: organization.id,
      metadata: parsed.data as unknown as Record<string, unknown>
    });

    response.status(200).json({ organization });
  } catch (error) {
    next(error);
  }
});

export const organizationRouter = router;

