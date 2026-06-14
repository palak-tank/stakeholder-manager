import { describe, it, expect } from 'vitest';
import { loginResponseSchema, meResponseSchema } from './auth';

describe('loginResponseSchema', () => {
  it('parses a valid email', () => {
    expect(loginResponseSchema.parse({ email: 'user@example.com' })).toEqual({
      email: 'user@example.com',
    });
  });

  it('rejects an invalid email', () => {
    expect(() => loginResponseSchema.parse({ email: 'not-an-email' })).toThrow();
  });
});

describe('meResponseSchema', () => {
  it('parses a valid email', () => {
    expect(meResponseSchema.parse({ email: 'admin@company.org' })).toEqual({
      email: 'admin@company.org',
    });
  });

  it('rejects an empty email', () => {
    expect(() => meResponseSchema.parse({ email: '' })).toThrow();
  });
});
