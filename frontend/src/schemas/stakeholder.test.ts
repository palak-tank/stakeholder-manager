import { describe, it, expect } from 'vitest';
import {
  stakeholderFormSchema,
  stakeholderSchema,
  pagedStakeholderSchema,
} from './stakeholder';

const validPayload = {
  firstName: 'Alice',
  lastName: 'Johnson',
  email: 'alice@example.com',
  role: 'Investor' as const,
  roleOther: '',
  organisation: 'Acme Corp',
  title: 'Miss' as const,
  titleOther: '',
};

describe('stakeholderFormSchema', () => {
  it('parses a fully valid payload', () => {
    const result = stakeholderFormSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('parses when role and title are both Other with custom values', () => {
    const result = stakeholderFormSchema.safeParse({
      ...validPayload,
      role: 'Other',
      roleOther: 'Sponsor',
      title: 'Other',
      titleOther: 'Dr.',
    });
    expect(result.success).toBe(true);
  });

  // firstName
  it('fails when firstName is empty', () => {
    const result = stakeholderFormSchema.safeParse({ ...validPayload, firstName: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.flatten().fieldErrors.firstName;
      expect(msgs).toBeDefined();
    }
  });

  it('fails when firstName is 1 character', () => {
    const result = stakeholderFormSchema.safeParse({ ...validPayload, firstName: 'A' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.flatten().fieldErrors.firstName;
      expect(msgs?.some(m => m.includes('at least 2'))).toBe(true);
    }
  });

  it('fails when firstName exceeds 100 characters', () => {
    const result = stakeholderFormSchema.safeParse({
      ...validPayload,
      firstName: 'A'.repeat(101),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.flatten().fieldErrors.firstName;
      expect(msgs?.some(m => m.includes('at most 100'))).toBe(true);
    }
  });

  // lastName
  it('fails when lastName is empty', () => {
    const result = stakeholderFormSchema.safeParse({ ...validPayload, lastName: '' });
    expect(result.success).toBe(false);
  });

  it('fails when lastName is 1 character', () => {
    const result = stakeholderFormSchema.safeParse({ ...validPayload, lastName: 'B' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.flatten().fieldErrors.lastName;
      expect(msgs?.some(m => m.includes('at least 2'))).toBe(true);
    }
  });

  it('fails when lastName exceeds 100 characters', () => {
    const result = stakeholderFormSchema.safeParse({
      ...validPayload,
      lastName: 'B'.repeat(101),
    });
    expect(result.success).toBe(false);
  });

  // email
  it('fails when email is empty', () => {
    const result = stakeholderFormSchema.safeParse({ ...validPayload, email: '' });
    expect(result.success).toBe(false);
  });

  it('fails when email is not a valid address', () => {
    const result = stakeholderFormSchema.safeParse({
      ...validPayload,
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.flatten().fieldErrors.email;
      expect(msgs?.some(m => m.includes('valid email'))).toBe(true);
    }
  });

  // organisation
  it('fails when organisation is empty', () => {
    const result = stakeholderFormSchema.safeParse({ ...validPayload, organisation: '' });
    expect(result.success).toBe(false);
  });

  it('fails when organisation is 1 character', () => {
    const result = stakeholderFormSchema.safeParse({ ...validPayload, organisation: 'X' });
    expect(result.success).toBe(false);
  });

  // role superRefine
  it('fails with "Role is required" when role is empty string', () => {
    const result = stakeholderFormSchema.safeParse({ ...validPayload, role: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.flatten().fieldErrors.role;
      expect(msgs?.some(m => m === 'Role is required')).toBe(true);
    }
  });

  it('fails with "Please enter your custom role" when role is Other but roleOther is missing', () => {
    const result = stakeholderFormSchema.safeParse({
      ...validPayload,
      role: 'Other',
      roleOther: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.flatten().fieldErrors.roleOther;
      expect(msgs?.some(m => m === 'Please enter your custom role')).toBe(true);
    }
  });

  it('passes when role is Other and roleOther is provided', () => {
    const result = stakeholderFormSchema.safeParse({
      ...validPayload,
      role: 'Other',
      roleOther: 'Sponsor',
    });
    expect(result.success).toBe(true);
  });

  // title superRefine
  it('passes when title is empty string (title is optional)', () => {
    const result = stakeholderFormSchema.safeParse({ ...validPayload, title: '' });
    expect(result.success).toBe(true);
  });

  it('passes when title is Other and titleOther is empty', () => {
    const result = stakeholderFormSchema.safeParse({ ...validPayload, title: 'Other', titleOther: '' });
    expect(result.success).toBe(true);
  });

  it('passes when title is Other and titleOther has a value', () => {
    const result = stakeholderFormSchema.safeParse({ ...validPayload, title: 'Other', titleOther: 'Dr.' });
    expect(result.success).toBe(true);
  });
});

describe('stakeholderSchema', () => {
  const validApiObject = {
    id: 1,
    firstName: 'Alice',
    lastName: 'Johnson',
    email: 'alice@example.com',
    role: 'Investor',
    organisation: 'Acme Corp',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
    title: 'Ms.',
  };

  it('parses a valid API response object', () => {
    const result = stakeholderSchema.safeParse(validApiObject);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(1);
      expect(result.data.title).toBe('Ms.');
    }
  });

  it('transforms null title to undefined', () => {
    const result = stakeholderSchema.safeParse({ ...validApiObject, title: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBeUndefined();
    }
  });

  it('fails when required fields are missing', () => {
    const { firstName: _omitted, ...withoutFirstName } = validApiObject;
    const result = stakeholderSchema.safeParse(withoutFirstName);
    expect(result.success).toBe(false);
  });
});

describe('pagedStakeholderSchema', () => {
  it('parses a valid paged response', () => {
    const result = pagedStakeholderSchema.safeParse({
      items: [
        {
          id: 1,
          firstName: 'Alice',
          lastName: 'Johnson',
          email: 'alice@example.com',
          role: 'Investor',
          organisation: 'Acme Corp',
          createdAt: '2024-01-15T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
          title: 'Ms.',
        },
      ],
      totalCount: 1,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalCount).toBe(1);
      expect(result.data.items).toHaveLength(1);
    }
  });
});
