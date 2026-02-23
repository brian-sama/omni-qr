import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const booleanFromString = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }

  return false;
}, z.boolean());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  APP_BASE_URL: z.string().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1).default("postgresql://scansuite:scansuite@localhost:5432/scansuite"),
  JWT_ACCESS_SECRET: z.string().min(16).default("replace-with-long-access-secret-for-local-dev"),
  JWT_REFRESH_SECRET: z.string().min(16).default("replace-with-long-refresh-secret-for-local-dev"),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL: z.string().default("30d"),
  PUBLIC_ACCESS_TOKEN_TTL: z.string().default("10m"),
  S3_ENDPOINT: z.string().default("http://localhost:9000"),
  S3_REGION: z.string().default("us-east-1"),
  S3_ACCESS_KEY: z.string().min(1).default("minioadmin"),
  S3_SECRET_KEY: z.string().min(1).default("minioadmin"),
  S3_BUCKET: z.string().min(1).default("scansuite-files"),
  S3_FORCE_PATH_STYLE: booleanFromString.default(true),
  MAX_FILE_SIZE_MB: z.coerce.number().int().positive().default(20),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  SENTRY_DSN: z.string().optional().or(z.literal(""))
});

export const env = envSchema.parse(process.env);

export const isProduction = env.NODE_ENV === "production";

