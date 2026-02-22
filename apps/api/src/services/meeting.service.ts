import bcrypt from "bcryptjs";
import slugify from "slugify";
import { AccessType, AuditAction, MeetingStatus, Role } from "@prisma/client";
import type { CreateMeetingInput, PatchMeetingInput } from "@omniqr/shared";
import { prisma } from "../lib/prisma";
import { writeAuditLog } from "./audit.service";

export function isExpired(expiresAt: Date | null | undefined): boolean {
  return Boolean(expiresAt && new Date() > expiresAt);
}

function buildSlug(title: string): string {
  const base = slugify(title, {
    lower: true,
    strict: true,
    trim: true
  }).slice(0, 50);

  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

function mapMeetingWithMetrics(meeting: {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: MeetingStatus;
  createdAt: Date;
  expiresAt: Date | null;
  accessPolicy: { accessType: AccessType } | null;
  _count: { files: number; scanEvents: number };
}) {
  return {
    id: meeting.id,
    slug: meeting.slug,
    title: meeting.title,
    description: meeting.description,
    status: meeting.status === MeetingStatus.ACTIVE && isExpired(meeting.expiresAt) ? "EXPIRED" : meeting.status,
    accessType: meeting.accessPolicy?.accessType ?? "PUBLIC",
    createdAt: meeting.createdAt,
    expiresAt: meeting.expiresAt,
    fileCount: meeting._count.files,
    scanCount: meeting._count.scanEvents
  };
}

export async function listMeetingsForOrganization(organizationId: string) {
  const meetings = await prisma.meeting.findMany({
    where: { organizationId },
    include: {
      accessPolicy: {
        select: {
          accessType: true
        }
      },
      _count: {
        select: {
          files: true,
          scanEvents: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return meetings.map(mapMeetingWithMetrics);
}

export async function createMeeting(
  organizationId: string,
  userId: string,
  payload: CreateMeetingInput
) {
  const slug = buildSlug(payload.title);
  const passwordHash = payload.accessPolicy?.password
    ? await bcrypt.hash(payload.accessPolicy.password, 12)
    : null;

  const meeting = await prisma.meeting.create({
    data: {
      organizationId,
      createdById: userId,
      slug,
      title: payload.title,
      description: payload.description,
      startsAt: payload.startsAt ? new Date(payload.startsAt) : null,
      expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : null,
      accessPolicy: {
        create: {
          accessType: payload.accessPolicy?.accessType ?? AccessType.PUBLIC,
          passwordHash,
          accessStartsAt: payload.accessPolicy?.accessStartsAt
            ? new Date(payload.accessPolicy.accessStartsAt)
            : null,
          accessEndsAt: payload.accessPolicy?.accessEndsAt
            ? new Date(payload.accessPolicy.accessEndsAt)
            : null,
          oneTimeAccess: payload.accessPolicy?.oneTimeAccess ?? false,
          viewOnly: payload.accessPolicy?.viewOnly ?? false
        }
      }
    },
    include: {
      accessPolicy: true,
      _count: {
        select: {
          files: true,
          scanEvents: true
        }
      }
    }
  });

  await writeAuditLog({
    organizationId,
    actorUserId: userId,
    meetingId: meeting.id,
    action: AuditAction.MEETING_CREATE,
    entityType: "meeting",
    entityId: meeting.id,
    metadata: {
      title: meeting.title,
      accessType: meeting.accessPolicy?.accessType ?? AccessType.PUBLIC
    }
  });

  return mapMeetingWithMetrics(meeting);
}

export async function getMeetingById(organizationId: string, meetingId: string) {
  const meeting = await prisma.meeting.findFirst({
    where: {
      id: meetingId,
      organizationId
    },
    include: {
      accessPolicy: true,
      files: {
        orderBy: {
          updatedAt: "desc"
        },
        include: {
          versions: {
            orderBy: {
              version: "desc"
            },
            take: 1
          }
        }
      },
      _count: {
        select: {
          files: true,
          scanEvents: true
        }
      }
    }
  });

  if (!meeting) {
    return null;
  }

  return {
    ...mapMeetingWithMetrics(meeting),
    accessPolicy: meeting.accessPolicy,
    files: meeting.files.map((file) => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: file.size,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
      latestVersion: file.versions[0]
        ? {
            id: file.versions[0].id,
            version: file.versions[0].version,
            status: file.versions[0].status,
            createdAt: file.versions[0].createdAt
          }
        : null
    }))
  };
}

export async function patchMeeting(
  organizationId: string,
  userId: string,
  currentRole: Role,
  meetingId: string,
  payload: PatchMeetingInput
) {
  const current = await prisma.meeting.findFirst({
    where: { id: meetingId, organizationId },
    include: { accessPolicy: true }
  });

  if (!current) {
    return null;
  }

  if (payload.status === MeetingStatus.EXPIRED && currentRole === Role.VIEWER) {
    throw new Error("Insufficient permissions to expire a meeting");
  }

  const passwordHash = payload.accessPolicy?.password
    ? await bcrypt.hash(payload.accessPolicy.password, 12)
    : undefined;

  const meeting = await prisma.meeting.update({
    where: { id: meetingId },
    data: {
      title: payload.title,
      description: payload.description,
      startsAt: payload.startsAt ? new Date(payload.startsAt) : undefined,
      expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : undefined,
      status: payload.status,
      accessPolicy: payload.accessPolicy
        ? {
            upsert: {
              create: {
                accessType: payload.accessPolicy.accessType ?? current.accessPolicy?.accessType ?? AccessType.PUBLIC,
                passwordHash: passwordHash ?? null,
                accessStartsAt: payload.accessPolicy.accessStartsAt
                  ? new Date(payload.accessPolicy.accessStartsAt)
                  : null,
                accessEndsAt: payload.accessPolicy.accessEndsAt
                  ? new Date(payload.accessPolicy.accessEndsAt)
                  : null,
                oneTimeAccess: payload.accessPolicy.oneTimeAccess ?? false,
                viewOnly: payload.accessPolicy.viewOnly ?? false
              },
              update: {
                accessType: payload.accessPolicy.accessType,
                passwordHash,
                accessStartsAt: payload.accessPolicy.accessStartsAt
                  ? new Date(payload.accessPolicy.accessStartsAt)
                  : undefined,
                accessEndsAt: payload.accessPolicy.accessEndsAt
                  ? new Date(payload.accessPolicy.accessEndsAt)
                  : undefined,
                oneTimeAccess: payload.accessPolicy.oneTimeAccess,
                viewOnly: payload.accessPolicy.viewOnly
              }
            }
          }
        : undefined
    },
    include: {
      accessPolicy: {
        select: {
          accessType: true
        }
      },
      _count: {
        select: {
          files: true,
          scanEvents: true
        }
      }
    }
  });

  await writeAuditLog({
    organizationId,
    actorUserId: userId,
    meetingId,
    action: AuditAction.MEETING_UPDATE,
    entityType: "meeting",
    entityId: meetingId,
    metadata: payload as unknown as Record<string, unknown>
  });

  return mapMeetingWithMetrics(meeting);
}

