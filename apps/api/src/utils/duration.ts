const UNIT_TO_MS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000
};

export function ttlToMs(ttl: string): number {
  const normalized = ttl.trim().toLowerCase();
  const match = normalized.match(/^(\d+)(ms|s|m|h|d)$/);

  if (!match) {
    throw new Error(`Unsupported TTL format: ${ttl}`);
  }

  const amount = Number.parseInt(match[1], 10);
  return amount * UNIT_TO_MS[match[2]];
}

