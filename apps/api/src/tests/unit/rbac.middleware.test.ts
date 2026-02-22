import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { requireRole } from "../../middleware/rbac";

describe("requireRole", () => {
  it("allows user with required role", async () => {
    const app = express();

    app.get(
      "/secure",
      (req, _res, next) => {
        req.user = {
          id: "1",
          email: "admin@example.com",
          organizationId: "org",
          role: "ADMIN"
        };
        next();
      },
      requireRole("EDITOR"),
      (_req, res) => {
        res.status(200).json({ ok: true });
      }
    );

    const response = await request(app).get("/secure");
    expect(response.status).toBe(200);
  });

  it("blocks user with low role", async () => {
    const app = express();

    app.get(
      "/secure",
      (req, _res, next) => {
        req.user = {
          id: "1",
          email: "viewer@example.com",
          organizationId: "org",
          role: "VIEWER"
        };
        next();
      },
      requireRole("EDITOR"),
      (_req, res) => {
        res.status(200).json({ ok: true });
      }
    );

    const response = await request(app).get("/secure");
    expect(response.status).toBe(403);
  });
});

