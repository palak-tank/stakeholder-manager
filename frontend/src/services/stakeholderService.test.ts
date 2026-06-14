import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getStakeholders,
  createStakeholder,
  updateStakeholder,
  deleteStakeholder,
} from './stakeholderService';
import { ApiError } from './apiError';

const validStakeholder = {
  id: 1,
  firstName: 'Alice',
  lastName: 'Johnson',
  email: 'alice@example.com',
  role: 'Investor',
  organisation: 'Acme Corp',
  createdAt: '2024-01-15T00:00:00Z',
  title: 'Ms.',
};

const validPagedResponse = {
  items: [validStakeholder],
  totalCount: 1,
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

describe('getStakeholders', () => {
  it('resolves with parsed PagedStakeholders on success', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(makeResponse(200, validPagedResponse));
    const result = await getStakeholders();
    expect(result.totalCount).toBe(1);
    expect(result.items[0].firstName).toBe('Alice');
  });

  it('calls fetch with default page=0 and pageSize=10', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(makeResponse(200, validPagedResponse));
    await getStakeholders();
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/stakeholders?page=0&pageSize=10',
      { credentials: 'include' }
    );
  });

  it('calls fetch with custom page and pageSize', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(makeResponse(200, validPagedResponse));
    await getStakeholders(2, 25);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/stakeholders?page=2&pageSize=25',
      { credentials: 'include' }
    );
  });

  it('rejects with ApiError(0, ...) on network failure', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));
    const err = await getStakeholders().catch(e => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(0);
    expect((err as ApiError).message).toContain('Unable to reach');
  });

  it('rejects with ApiError on server error', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(makeResponse(404));
    const err = await getStakeholders().catch(e => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(404);
  });
});

describe('createStakeholder', () => {
  const input = {
    firstName: 'Bob',
    lastName: 'Smith',
    email: 'bob@example.com',
    role: 'Advisor',
    organisation: 'TechCorp',
    title: 'Mr.',
  };

  it('resolves with parsed Stakeholder on success', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      makeResponse(201, { ...validStakeholder, ...input, id: 2 })
    );
    const result = await createStakeholder(input);
    expect(result.firstName).toBe('Bob');
  });

  it('calls POST /api/stakeholders with Content-Type and body', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(makeResponse(201, validStakeholder));
    await createStakeholder(input);
    expect(global.fetch).toHaveBeenCalledWith('/api/stakeholders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(input),
    });
  });

  it('rejects with ApiError(0, ...) on network failure', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));
    const err = await createStakeholder(input).catch(e => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(0);
  });

  it('rejects with ApiError on server error', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(makeResponse(409));
    const err = await createStakeholder(input).catch(e => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(409);
  });
});

describe('updateStakeholder', () => {
  const input = {
    firstName: 'Alice',
    lastName: 'Updated',
    email: 'alice@example.com',
    role: 'Investor',
    organisation: 'New Org',
    title: 'Ms.',
  };

  it('resolves with parsed Stakeholder on success', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      makeResponse(200, { ...validStakeholder, lastName: 'Updated' })
    );
    const result = await updateStakeholder(1, input);
    expect(result.lastName).toBe('Updated');
  });

  it('calls PUT /api/stakeholders/:id with correct body', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(makeResponse(200, validStakeholder));
    await updateStakeholder(42, input);
    expect(global.fetch).toHaveBeenCalledWith('/api/stakeholders/42', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(input),
    });
  });

  it('rejects with ApiError(0, ...) on network failure', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));
    const err = await updateStakeholder(1, input).catch(e => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(0);
  });

  it('rejects with ApiError on server error', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(makeResponse(422));
    const err = await updateStakeholder(1, input).catch(e => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(422);
  });
});

describe('deleteStakeholder', () => {
  it('resolves without a value on 204', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(deleteStakeholder(1)).resolves.toBeUndefined();
  });

  it('calls DELETE /api/stakeholders/:id', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));
    await deleteStakeholder(42);
    expect(global.fetch).toHaveBeenCalledWith('/api/stakeholders/42', {
      method: 'DELETE',
      credentials: 'include',
    });
  });

  it('rejects with ApiError(0, ...) on network failure', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));
    const err = await deleteStakeholder(1).catch(e => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(0);
  });

  it('rejects with ApiError on server error', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(makeResponse(403));
    const err = await deleteStakeholder(1).catch(e => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(403);
  });
});
