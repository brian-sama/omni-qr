import { describe, expect, it } from "vitest";
import { ttlToMs } from "../../utils/duration";

describe("ttlToMs", () => {
  it("parses minutes", () => {
    expect(ttlToMs("15m")).toBe(900000);
  });

  it("parses days", () => {
    expect(ttlToMs("2d")).toBe(172800000);
  });

  it("throws on unsupported format", () => {
    expect(() => ttlToMs("900")).toThrow("Unsupported TTL format");
  });
});

