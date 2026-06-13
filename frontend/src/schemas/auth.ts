import { z } from 'zod';

export const loginResponseSchema = z.object({ email: z.string().email() });
export const meResponseSchema = z.object({ email: z.string().email() });
