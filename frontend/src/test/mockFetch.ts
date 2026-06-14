import { vi } from 'vitest';

export function setupFetchMock() {
  vi.stubGlobal('fetch', vi.fn());
}

export function mockFetchOk(body: unknown, status = 200) {
  vi.mocked(global.fetch).mockResolvedValueOnce(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

export function mockFetchError(status: number, body?: unknown) {
  vi.mocked(global.fetch).mockResolvedValueOnce(
    new Response(body !== undefined ? JSON.stringify(body) : null, {
      status,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
    })
  );
}

export function mockFetchNetworkFailure() {
  vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));
}
