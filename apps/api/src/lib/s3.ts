import { S3Client } from "@aws-sdk/client-s3";
import { env } from "../config/env";

export const s3 = new S3Client({
  region: env.S3_REGION,
  endpoint: env.S3_ENDPOINT,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY
  },
  forcePathStyle: env.S3_FORCE_PATH_STYLE
});

