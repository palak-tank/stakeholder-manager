import { z } from 'zod';

export const stakeholderSchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  role: z.string(),
  organisation: z.string(),
  createdAt: z.string(),
  title: z.string().optional(),
});

export const stakeholderArraySchema = z.array(stakeholderSchema);
