import { z } from 'zod';

// ---------------------------------------------------------------------------
// API response schema
// ---------------------------------------------------------------------------

export const stakeholderSchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  role: z.string(),
  organisation: z.string(),
  createdAt: z.string(),
  title: z.string().nullable().optional().transform(v => v ?? undefined),
});

export const stakeholderArraySchema = z.array(stakeholderSchema);

export const pagedStakeholderSchema = z.object({
  items: stakeholderArraySchema,
  totalCount: z.number(),
});

export type PagedStakeholders = z.infer<typeof pagedStakeholderSchema>;

// ---------------------------------------------------------------------------
// Form schema
// ---------------------------------------------------------------------------

export const TITLE_OPTIONS = ['Mr.', 'Miss', 'Mrs.', 'Other'] as const;
export const ROLE_OPTIONS = ['Investor', 'Advisor', 'Partner', 'Board Member', 'Mentor', 'Other'] as const;

export const stakeholderFormSchema = z
  .object({
    firstName: z
      .string({ required_error: 'First name is required' })
      .trim()
      .min(1, 'First name is required')
      .min(2, 'First name must be at least 2 characters')
      .max(100, 'First name must be at most 100 characters'),

    lastName: z
      .string({ required_error: 'Last name is required' })
      .trim()
      .min(1, 'Last name is required')
      .min(2, 'Last name must be at least 2 characters')
      .max(100, 'Last name must be at most 100 characters'),

    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .min(1, 'Email is required')
      .email('Enter a valid email address'),

    role: z.enum(['' , ...ROLE_OPTIONS] as const),

    roleOther: z
      .string()
      .trim()
      .max(100, 'Custom role must be at most 100 characters')
      .optional(),

    organisation: z
      .string({ required_error: 'Organisation is required' })
      .trim()
      .min(1, 'Organisation is required')
      .min(2, 'Organisation must be at least 2 characters')
      .max(100, 'Organisation must be at most 100 characters'),

    title: z.enum(['', ...TITLE_OPTIONS] as const),

    titleOther: z
      .string()
      .trim()
      .max(100, 'Custom title must be at most 100 characters')
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.role) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['role'],
        message: 'Role is required',
      });
    }
    if (data.role === 'Other' && !data.roleOther) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['roleOther'],
        message: 'Please enter your custom role',
      });
    }
  });
  
export type StakeholderFormValues = z.infer<typeof stakeholderFormSchema>;
