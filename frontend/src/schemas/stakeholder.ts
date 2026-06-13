import { z } from 'zod';

export const stakeholderSchema = z.object({
  id: z.number(),
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  email: z.string().email(),
  role: z.string().min(2).max(100),
  organisation: z.string().min(2).max(100),
  createdAt: z.string(),
  title: z.string().optional(),
});

export const stakeholderArraySchema = z.array(stakeholderSchema);

export const pagedStakeholderSchema = z.object({
  items: stakeholderArraySchema,
  totalCount: z.number(),
});

export type PagedStakeholders = z.infer<typeof pagedStakeholderSchema>;
