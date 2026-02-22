import { Router } from "express";
import { FileVersionStatus, MeetingStatus } from "@prisma/client";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();

function classifyDevice(userAgent?: string | null): "mobile" | "desktop" | "other" {
  if (!userAgent) {
    return "other";
  }

  const lower = userAgent.toLowerCase();
  if (lower.includes("android") || lower.includes("iphone") || lower.includes("mobile")) {
    return "mobile";
  }

  if (lower.includes("windows") || lower.includes("macintosh") || lower.includes("linux")) {
    return "desktop";
  }

  return "other";
}

router.get("/overview", requireAuth, async (request, response, next) => {
  try {
    const organizationId = request.user!.organizationId;

    const [
      totalMeetings,
      activeMeetings,
      totalScans,
      fileSizeAgg,
      recentScanEvents,
      topFiles
    ] = await Promise.all([
      prisma.meeting.count({
        where: { organizationId }
      }),
      prisma.meeting.count({
        where: {
          organizationId,
          status: MeetingStatus.ACTIVE,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
        }
      }),
      prisma.scanEvent.count({
        where: { organizationId }
      }),
      prisma.file.aggregate({
        where: { organizationId },
        _sum: { size: true }
      }),
      prisma.scanEvent.findMany({
        where: {
          organizationId,
          scannedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        select: {
          scannedAt: true,
          device: true
        },
        orderBy: {
          scannedAt: "asc"
        }
      }),
      prisma.file.findMany({
        where: {
          organizationId,
          versions: {
            some: {
              status: FileVersionStatus.READY
            }
          }
        },
        select: {
          id: true,
          name: true,
          meeting: {
            select: {
              id: true,
              title: true
            }
          },
          _count: {
            select: {
              versions: true
            }
          }
        },
        orderBy: {
          updatedAt: "desc"
        },
        take: 5
      })
    ]);

    const scansByDay = recentScanEvents.reduce<Record<string, number>>((accumulator, event) => {
      const key = event.scannedAt.toISOString().slice(0, 10);
      accumulator[key] = (accumulator[key] ?? 0) + 1;
      return accumulator;
    }, {});

    const deviceBreakdown = recentScanEvents.reduce<Record<string, number>>((accumulator, event) => {
      const deviceClass = classifyDevice(event.device);
      accumulator[deviceClass] = (accumulator[deviceClass] ?? 0) + 1;
      return accumulator;
    }, {});

    response.status(200).json({
      totals: {
        totalMeetings,
        activeMeetings,
        totalScans,
        storageBytes: fileSizeAgg._sum.size ?? 0
      },
      timeline: Object.entries(scansByDay).map(([date, scans]) => ({ date, scans })),
      deviceBreakdown,
      topFiles: topFiles.map((file) => ({
        id: file.id,
        name: file.name,
        meeting: file.meeting,
        versions: file._count.versions
      }))
    });
  } catch (error) {
    next(error);
  }
});

export const analyticsRouter = router;

