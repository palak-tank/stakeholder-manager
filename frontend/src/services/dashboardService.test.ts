import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDashboardStats } from './dashboardService';
import { ApiError } from './apiError';

const validStats = {
  totalStakeholders: 10,
  totalOrganisations: 5,
  roleBreakdown: [{ role: 'Investor', count: 4 }],
  topOrganisations: [{ organisation: 'Acme Corp', count: 3 }],
  recentStakeholders: [],
};

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

describe('getDashboardStats', () => {
  it('resolves with DashboardStats on success', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(makeResponse(200, validStats));
    const stats = await getDashboardStats();
    expect(stats.totalStakeholders).toBe(10);
    expect(stats.roleBreakdown[0].role).toBe('Investor');
  });

  it('calls GET /api/dashboard with credentials', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(makeResponse(200, validStats));
    await getDashboardStats();
    expect(global.fetch).toHaveBeenCalledWith('/api/dashboard', { credentials: 'include' });
  });

  it('rejects with ApiError(0, ...) on network failure', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));
    const err = await getDashboardStats().catch(e => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(0);
    expect((err as ApiError).message).toContain('Unable to reach');
  });

  it('rejects with ApiError on server error', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(makeResponse(500));
    const err = await getDashboardStats().catch(e => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(500);
  });
});
