import { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

type AuditLogInput = {
  organizationId: string;
  actorUserId?: string;
  meetingId?: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
};

export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      meetingId: input.meetingId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata as Prisma.InputJsonValue | undefined
    }
  });
}

