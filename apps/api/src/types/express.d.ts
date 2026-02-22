import type { Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        organizationId: string;
        email: string;
        role: Role;
      };
      publicAccess?: {
        meetingId: string;
        organizationId: string;
      };
      id?: string;
    }
  }
}

export {};

