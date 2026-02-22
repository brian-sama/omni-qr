import { describe, expect, it } from "vitest";
import { evaluateAccessPolicy } from "../../services/access-policy.service";

describe("evaluateAccessPolicy", () => {
  it("allows public policy", () => {
    const result = evaluateAccessPolicy({ policy: null });
    expect(result.allowed).toBe(true);
    expect(result.requiresPassword).toBe(false);
  });

  it("requires password when policy is password protected", () => {
    const result = evaluateAccessPolicy({
      policy: {
        id: "p1",
        meetingId: "m1",
        accessType: "PASSWORD",
        passwordHash: "hash",
        accessStartsAt: null,
        accessEndsAt: null,
        oneTimeAccess: false,
        viewOnly: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    expect(result.allowed).toBe(false);
    expect(result.requiresPassword).toBe(true);
  });

  it("allows access when password check already passed", () => {
    const result = evaluateAccessPolicy({
      policy: {
        id: "p1",
        meetingId: "m1",
        accessType: "PASSWORD",
        passwordHash: "hash",
        accessStartsAt: null,
        accessEndsAt: null,
        oneTimeAccess: false,
        viewOnly: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      bypassPassword: true
    });

    expect(result.allowed).toBe(true);
    expect(result.requiresPassword).toBe(false);
  });
});

