import { z } from "zod";

export const roleSchema = z.enum(["OWNER", "ADMIN", "EDITOR", "VIEWER"]);
export type Role = z.infer<typeof roleSchema>;

export const accessTypeSchema = z.enum(["PUBLIC", "PASSWORD", "PRIVATE"]);
export type AccessType = z.infer<typeof accessTypeSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(12)
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1).optional()
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

