import type { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";

const rolePriority: Record<Role, number> = {
  OWNER: 4,
  ADMIN: 3,
  EDITOR: 2,
  VIEWER: 1
};

export function requireRole(minimumRole: Role) {
  return (request: Request, response: Response, next: NextFunction): void => {
    if (!request.user) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (rolePriority[request.user.role] < rolePriority[minimumRole]) {
      response.status(403).json({ error: "Forbidden" });
      return;
    }

    next();
  };
}

