import { describe, expect, it } from "vitest";
import {
  hashToken,
  signAccessToken,
  signPublicToken,
  signRefreshToken,
  verifyAccessToken,
  verifyPublicToken,
  verifyRefreshToken
} from "../../services/token.service";

describe("token.service", () => {
  it("signs and verifies access token", () => {
    const token = signAccessToken({
      userId: "u1",
      organizationId: "o1",
      role: "ADMIN",
      email: "admin@example.com"
    });

    const payload = verifyAccessToken(token);
    expect(payload.userId).toBe("u1");
    expect(payload.type).toBe("access");
  });

  it("signs and verifies refresh token", () => {
    const token = signRefreshToken({
      userId: "u1",
      organizationId: "o1",
      sessionId: "s1"
    });

    const payload = verifyRefreshToken(token);
    expect(payload.sessionId).toBe("s1");
    expect(payload.type).toBe("refresh");
  });

  it("signs and verifies public token", () => {
    const token = signPublicToken({
      meetingId: "m1",
      organizationId: "o1"
    });

    const payload = verifyPublicToken(token);
    expect(payload.meetingId).toBe("m1");
    expect(payload.type).toBe("public");
  });

  it("hashes token deterministically", () => {
    const input = "token-value";
    const hashA = hashToken(input);
    const hashB = hashToken(input);

    expect(hashA).toEqual(hashB);
    expect(hashA).toHaveLength(64);
  });
});

