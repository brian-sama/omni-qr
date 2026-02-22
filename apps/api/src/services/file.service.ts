import path from "node:path";
import crypto from "node:crypto";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { AuditAction, FileVersionStatus } from "@prisma/client";
import type { CompleteUploadInput, PresignUploadInput } from "@omniqr/shared";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { s3 } from "../lib/s3";
import { writeAuditLog } from "./audit.service";
import { emitMeetingEvent } from "../realtime/socket";

function sanitizeFileName(fileName: string): string {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
  return safe.slice(0, 220);
}

function buildObjectKey(organizationId: string, meetingId: string, fileId: string, version: number, fileName: string): string {
  const safeFileName = sanitizeFileName(fileName);
  return path.posix.join(organizationId, meetingId, fileId, `v${version}`, `${crypto.randomUUID()}-${safeFileName}`);
}

function toSignedResponse(url: string) {
  return {
    method: "PUT",
    url,
    expiresInSeconds: 900
  };
}

export async function createPresignedUpload(
  organizationId: string,
  userId: string,
  payload: PresignUploadInput
) {
  const maxFileSize = env.MAX_FILE_SIZE_MB * 1024 * 1024;

  if (payload.size > maxFileSize) {
    throw new Error(`File exceeds max size of ${env.MAX_FILE_SIZE_MB}MB`);
  }

  const meeting = await prisma.meeting.findFirst({
    where: {
      id: payload.meetingId,
      organizationId
    },
    include: {
      accessPolicy: true
    }
  });

  if (!meeting) {
    throw new Error("Meeting not found");
  }

  const existingFile = await prisma.file.findFirst({
    where: {
      organizationId,
      meetingId: payload.meetingId,
      name: payload.fileName
    },
    include: {
      versions: {
        orderBy: {
          version: "desc"
        },
        take: 1
      }
    }
  });

  const nextVersion = existingFile?.versions?.[0]?.version ? existingFile.versions[0].version + 1 : 1;
  const fileId = existingFile?.id ?? crypto.randomUUID();
  const objectKey = buildObjectKey(organizationId, payload.meetingId, fileId, nextVersion, payload.fileName);

  const writeCommand = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: objectKey,
    ContentType: payload.mimeType,
    ContentLength: payload.size
  });

  const uploadUrl = await getSignedUrl(s3, writeCommand, { expiresIn: 900 });

  const result = await prisma.$transaction(async (transaction) => {
    const fileRecord = existingFile
      ? await transaction.file.update({
          where: { id: existingFile.id },
          data: {
            updatedAt: new Date()
          }
        })
      : await transaction.file.create({
          data: {
            id: fileId,
            organizationId,
            meetingId: payload.meetingId,
            name: payload.fileName,
            mimeType: payload.mimeType,
            size: payload.size,
            sha256: payload.sha256,
            objectKey,
            createdById: userId
          }
        });

    const versionRecord = await transaction.fileVersion.create({
      data: {
        fileId: fileRecord.id,
        version: nextVersion,
        objectKey,
        mimeType: payload.mimeType,
        size: payload.size,
        sha256: payload.sha256,
        status: FileVersionStatus.PENDING,
        createdById: userId
      }
    });

    return {
      fileId: fileRecord.id,
      versionId: versionRecord.id,
      version: versionRecord.version,
      objectKey
    };
  });

  await writeAuditLog({
    organizationId,
    actorUserId: userId,
    meetingId: payload.meetingId,
    action: AuditAction.FILE_PRESIGN,
    entityType: "file",
    entityId: result.fileId,
    metadata: {
      versionId: result.versionId,
      fileName: payload.fileName,
      size: payload.size
    }
  });

  return {
    ...result,
    upload: toSignedResponse(uploadUrl)
  };
}

export async function completeUpload(
  organizationId: string,
  userId: string,
  fileId: string,
  payload: CompleteUploadInput
) {
  const versionRecord = await prisma.fileVersion.findFirst({
    where: {
      id: payload.versionId,
      fileId,
      file: {
        organizationId
      }
    },
    include: {
      file: {
        include: {
          meeting: true
        }
      }
    }
  });

  if (!versionRecord) {
    throw new Error("Upload version not found");
  }

  const updated = await prisma.$transaction(async (transaction) => {
    const version = await transaction.fileVersion.update({
      where: {
        id: versionRecord.id
      },
      data: {
        size: payload.size,
        mimeType: payload.mimeType,
        sha256: payload.sha256,
        status: FileVersionStatus.READY
      }
    });

    const file = await transaction.file.update({
      where: {
        id: fileId
      },
      data: {
        size: payload.size,
        mimeType: payload.mimeType,
        sha256: payload.sha256,
        objectKey: version.objectKey,
        updatedAt: new Date()
      }
    });

    return { file, version };
  });

  const eventName = updated.version.version > 1 ? "file.versioned" : "file.added";

  emitMeetingEvent(versionRecord.file.meetingId, eventName, {
    meetingId: versionRecord.file.meetingId,
    fileId,
    version: updated.version.version,
    fileName: updated.file.name,
    timestamp: new Date().toISOString()
  });

  emitMeetingEvent(versionRecord.file.meetingId, "meeting.updated", {
    meetingId: versionRecord.file.meetingId,
    reason: eventName
  });

  await writeAuditLog({
    organizationId,
    actorUserId: userId,
    meetingId: versionRecord.file.meetingId,
    action: AuditAction.FILE_UPLOAD_COMPLETE,
    entityType: "file",
    entityId: fileId,
    metadata: {
      versionId: payload.versionId,
      version: updated.version.version
    }
  });

  return {
    fileId: updated.file.id,
    versionId: updated.version.id,
    version: updated.version.version,
    status: updated.version.status
  };
}

export async function createDownloadUrl(organizationId: string, userId: string, fileId: string) {
  const file = await prisma.file.findFirst({
    where: {
      id: fileId,
      organizationId
    },
    include: {
      meeting: {
        include: {
          accessPolicy: true
        }
      },
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
  });

  if (!file || file.versions.length === 0) {
    throw new Error("File not found");
  }

  const latestVersion = file.versions[0];

  const readCommand = new GetObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: latestVersion.objectKey,
    ResponseContentDisposition: `attachment; filename=\"${encodeURIComponent(file.name)}\"`
  });

  const url = await getSignedUrl(s3, readCommand, { expiresIn: 60 });

  await writeAuditLog({
    organizationId,
    actorUserId: userId,
    meetingId: file.meetingId,
    action: AuditAction.FILE_DOWNLOAD,
    entityType: "file",
    entityId: file.id,
    metadata: {
      version: latestVersion.version
    }
  });

  return {
    fileId: file.id,
    fileName: file.name,
    mimeType: latestVersion.mimeType,
    expiresInSeconds: 60,
    url
  };
}

export async function createPublicDownloadUrl(
  organizationId: string,
  meetingId: string,
  fileId: string
) {
  const file = await prisma.file.findFirst({
    where: {
      id: fileId,
      organizationId,
      meetingId
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
  });

  if (!file || file.versions.length === 0) {
    throw new Error("File not found");
  }

  const latestVersion = file.versions[0];

  const readCommand = new GetObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: latestVersion.objectKey,
    ResponseContentDisposition: `attachment; filename=\"${encodeURIComponent(file.name)}\"`
  });

  const url = await getSignedUrl(s3, readCommand, { expiresIn: 60 });

  return {
    fileId: file.id,
    fileName: file.name,
    mimeType: latestVersion.mimeType,
    expiresInSeconds: 60,
    url
  };
}

