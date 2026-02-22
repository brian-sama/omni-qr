import { z } from "zod";
import { accessTypeSchema } from "./auth";

export const meetingStatusSchema = z.enum(["DRAFT", "ACTIVE", "EXPIRED", "ARCHIVED"]);

export const createMeetingSchema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().max(2000).optional(),
  startsAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  accessPolicy: z
    .object({
      accessType: accessTypeSchema.default("PUBLIC"),
      password: z.string().min(8).max(128).optional(),
      accessStartsAt: z.string().datetime().optional(),
      accessEndsAt: z.string().datetime().optional(),
      oneTimeAccess: z.boolean().optional(),
      viewOnly: z.boolean().optional()
    })
    .optional()
});

export const patchMeetingSchema = createMeetingSchema.partial().extend({
  status: meetingStatusSchema.optional()
});

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
export type PatchMeetingInput = z.infer<typeof patchMeetingSchema>;

