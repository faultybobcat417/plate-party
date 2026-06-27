import { z } from "zod";

export const UUIDSchema = z.string().uuid();
export const DisplayNameSchema = z.string().trim().min(1).max(50);
export const UsernameSchema = z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/);
export const TitleSchema = z.string().trim().min(1).max(200);
export const DescriptionSchema = z.string().trim().max(2000);
export const PlateAmountSchema = z.number().int().positive();
export const OptionalIsoDateSchema = z.string().datetime().optional();

export const PaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(25),
});

export const FileUploadSchema = z.object({
  name: z.string().min(1).max(255),
  sizeBytes: z.number().int().min(1).max(50 * 1024 * 1024),
  mimeType: z.enum(["image/jpeg", "image/png", "image/gif", "video/mp4", "video/quicktime", "application/pdf"]),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;
export type FileUploadInput = z.infer<typeof FileUploadSchema>;
