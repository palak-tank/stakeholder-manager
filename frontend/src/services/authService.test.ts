import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { login, logout, getMe } from './authService';

function makeResponse(status: number, body?: unknown): Response {
  return new Response(
    body !== undefined ? JSON.stringify(body) : null,
    {
      status,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
    }
  );
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
  vi.stubGlobal('location', { href: '' });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('login', () => {
  it('resolves with AuthUser on success', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(makeResponse(200, { email: 'user@example.com' }));
    const user = await login('user@example.com', 'password123');
    expect(user).toEqual({ email: 'user@example.com' });
  });

  it('calls fetch with correct method, credentials, and body', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(makeResponse(200, { email: 'user@example.com' }));
    await login('user@example.com', 'password123');
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email: 'user@example.com', password: 'password123' }),
    });
  });

  it('rejects with "Invalid email or password." on 401', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(makeResponse(401));
    await expect(login('bad@example.com', 'wrong')).rejects.toThrow('Invalid email or password.');
  });

  it('rejects with "Login failed. Please try again." on server error', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(makeResponse(500));
    await expect(login('user@example.com', 'pw')).rejects.toThrow('Login failed. Please try again.');
  });

  it('rejects with ZodError when response body fails schema validation', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(makeResponse(200, { email: 'not-an-email' }));
    await expect(login('user@example.com', 'pw')).rejects.toThrow();
  });
});

describe('logout', () => {
  it('resolves without throwing', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(makeResponse(200));
    await expect(logout()).resolves.toBeUndefined();
  });

  it('calls fetch with POST to /api/auth/logout with credentials', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(makeResponse(200));
    await logout();
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  });
});

describe('getMe', () => {
  it('resolves with AuthUser on success', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(makeResponse(200, { email: 'me@example.com' }));
    const user = await getMe();
    expect(user).toEqual({ email: 'me@example.com' });
  });

  it('calls fetch with credentials:include', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(makeResponse(200, { email: 'me@example.com' }));
    await getMe();
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/me', { credentials: 'include' });
  });

  it('rejects with "Not authenticated" when response is not ok', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(makeResponse(401));
    await expect(getMe()).rejects.toThrow('Not authenticated');
  });

  it('rejects with ZodError when body fails schema validation', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(makeResponse(200, { email: 123 }));
    await expect(getMe()).rejects.toThrow();
  });
});
