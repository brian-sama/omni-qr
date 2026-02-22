import { z } from "zod";

export const presignUploadSchema = z.object({
  meetingId: z.string().uuid(),
  fileName: z.string().min(1).max(260),
  mimeType: z.string().min(1).max(140),
  size: z.number().int().positive(),
  sha256: z.string().regex(/^[a-fA-F0-9]{64}$/)
});

export const completeUploadSchema = z.object({
  versionId: z.string().uuid(),
  size: z.number().int().positive(),
  mimeType: z.string().min(1).max(140),
  sha256: z.string().regex(/^[a-fA-F0-9]{64}$/)
});

export type PresignUploadInput = z.infer<typeof presignUploadSchema>;
export type CompleteUploadInput = z.infer<typeof completeUploadSchema>;

