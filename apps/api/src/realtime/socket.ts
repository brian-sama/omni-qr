import { Server } from "socket.io";
import type { Server as HttpServer } from "node:http";
import { env } from "../config/env";
import { verifyAccessToken, verifyPublicToken } from "../services/token.service";
import { logger } from "../lib/logger";
import { COOKIE_NAMES } from "../utils/http";

let namespace: ReturnType<Server["of"]> | null = null;

function parseCookieHeader(header?: string): Record<string, string> {
  if (!header) {
    return {};
  }

  return header
    .split(";")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((accumulator, chunk) => {
      const separatorIndex = chunk.indexOf("=");

      if (separatorIndex === -1) {
        return accumulator;
      }

      const key = decodeURIComponent(chunk.slice(0, separatorIndex).trim());
      const value = decodeURIComponent(chunk.slice(separatorIndex + 1).trim());
      accumulator[key] = value;
      return accumulator;
    }, {});
}

export function createSocketServer(server: HttpServer): ReturnType<Server["of"]> {
  const io = new Server(server, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true
    }
  });

  namespace = io.of("/ws");

  namespace.use((socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      const parsedCookie = parseCookieHeader(cookieHeader);
      const authToken = socket.handshake.auth?.token ?? parsedCookie[COOKIE_NAMES.access];
      const publicToken = socket.handshake.auth?.publicToken ?? parsedCookie[COOKIE_NAMES.publicAccess];

      if (authToken && typeof authToken === "string") {
        const payload = verifyAccessToken(authToken);
        socket.data.user = {
          userId: payload.userId,
          organizationId: payload.organizationId,
          role: payload.role
        };
      }

      if (publicToken && typeof publicToken === "string") {
        const payload = verifyPublicToken(publicToken);
        socket.data.publicAccess = {
          meetingId: payload.meetingId,
          organizationId: payload.organizationId
        };
      }

      next();
    } catch (error) {
      next(error as Error);
    }
  });

  namespace.on("connection", (socket) => {
    socket.on("meeting.join", (meetingId: string) => {
      socket.join(`meeting:${meetingId}`);
    });

    socket.on("meeting.leave", (meetingId: string) => {
      socket.leave(`meeting:${meetingId}`);
    });

    socket.on("disconnect", () => {
      logger.debug({ socketId: socket.id }, "Socket disconnected");
    });
  });

  return namespace;
}

export function emitMeetingEvent(meetingId: string, eventName: string, payload: Record<string, unknown>): void {
  namespace?.to(`meeting:${meetingId}`).emit(eventName, payload);
}

