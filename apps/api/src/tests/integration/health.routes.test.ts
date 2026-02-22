import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../app";

describe("health endpoints", () => {
  it("returns alive response", async () => {
    const app = createApp();
    const response = await request(app).get("/health/live");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });

  it("returns not found for unknown route", async () => {
    const app = createApp();
    const response = await request(app).get("/does-not-exist");

    expect(response.status).toBe(404);
  });
});

