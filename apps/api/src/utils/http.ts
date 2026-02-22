import type { CookieOptions } from "express";
import { env, isProduction } from "../config/env";
import { ttlToMs } from "./duration";

export const COOKIE_NAMES = {
  access: "omniqr_access",
  refresh: "omniqr_refresh",
  publicAccess: "omniqr_public"
} as const;

export function buildAccessCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: ttlToMs(env.ACCESS_TOKEN_TTL),
    path: "/"
  };
}

export function buildRefreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "strict",
    secure: isProduction,
    maxAge: ttlToMs(env.REFRESH_TOKEN_TTL),
    path: "/api/v1/auth"
  };
}

export function buildPublicCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: ttlToMs(env.PUBLIC_ACCESS_TOKEN_TTL),
    path: "/api/v1/public"
  };
}

