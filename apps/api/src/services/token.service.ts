import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { env } from "../config/env";

export type AccessTokenPayload = {
  type: "access";
  userId: string;
  organizationId: string;
  role: Role;
  email: string;
};

export type RefreshTokenPayload = {
  type: "refresh";
  userId: string;
  organizationId: string;
  sessionId: string;
};

export type PublicTokenPayload = {
  type: "public";
  meetingId: string;
  organizationId: string;
};

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function signAccessToken(payload: Omit<AccessTokenPayload, "type">): string {
  return jwt.sign({ ...payload, type: "access" }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"]
  });
}

export function signRefreshToken(payload: Omit<RefreshTokenPayload, "type">): string {
  return jwt.sign({ ...payload, type: "refresh" }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.REFRESH_TOKEN_TTL as jwt.SignOptions["expiresIn"]
  });
}

export function signPublicToken(payload: Omit<PublicTokenPayload, "type">): string {
  return jwt.sign({ ...payload, type: "public" }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.PUBLIC_ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"]
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}

export function verifyPublicToken(token: string): PublicTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as PublicTokenPayload;
}

