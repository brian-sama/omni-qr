import { Router } from "express";
import { HeadBucketCommand } from "@aws-sdk/client-s3";
import { prisma } from "../lib/prisma";
import { s3 } from "../lib/s3";
import { env } from "../config/env";

const router = Router();

router.get("/live", (_request, response) => {
  response.status(200).json({
    status: "ok",
    service: "scansuite-api",
    timestamp: new Date().toISOString()
  });
});

router.get("/ready", async (_request, response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    await s3.send(
      new HeadBucketCommand({
        Bucket: env.S3_BUCKET
      })
    );

    response.status(200).json({
      status: "ready",
      checks: {
        database: "ok",
        objectStorage: "ok"
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    response.status(503).json({
      status: "not_ready",
      error: error instanceof Error ? error.message : "Dependency check failed",
      timestamp: new Date().toISOString()
    });
  }
});

export const healthRouter = router;

