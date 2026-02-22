import type { AccessType, MeetingAccessPolicy } from "@prisma/client";

type AccessCheckInput = {
  policy: MeetingAccessPolicy | null;
  now?: Date;
  bypassPassword?: boolean;
};

export type AccessCheckResult = {
  allowed: boolean;
  requiresPassword: boolean;
  reason?: string;
  accessType: AccessType;
};

export function evaluateAccessPolicy(input: AccessCheckInput): AccessCheckResult {
  const now = input.now ?? new Date();

  if (!input.policy) {
    return {
      allowed: true,
      requiresPassword: false,
      accessType: "PUBLIC"
    };
  }

  if (input.policy.accessStartsAt && now < input.policy.accessStartsAt) {
    return {
      allowed: false,
      requiresPassword: false,
      reason: "Access window has not started",
      accessType: input.policy.accessType
    };
  }

  if (input.policy.accessEndsAt && now > input.policy.accessEndsAt) {
    return {
      allowed: false,
      requiresPassword: false,
      reason: "Access window ended",
      accessType: input.policy.accessType
    };
  }

  if (input.policy.accessType === "PRIVATE") {
    return {
      allowed: false,
      requiresPassword: false,
      reason: "Meeting is private",
      accessType: input.policy.accessType
    };
  }

  if (input.policy.accessType === "PASSWORD" && !input.bypassPassword) {
    return {
      allowed: false,
      requiresPassword: true,
      reason: "Password required",
      accessType: input.policy.accessType
    };
  }

  return {
    allowed: true,
    requiresPassword: false,
    accessType: input.policy.accessType
  };
}

