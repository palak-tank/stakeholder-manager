import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, handleResponse } from './apiError';

function makeResponse(status: number, body?: unknown): Response {
  return new Response(
    body !== undefined ? JSON.stringify(body) : null,
    {
      status,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
    }
  );
}

describe('ApiError', () => {
  it('sets status, message, and name', () => {
    const err = new ApiError(404, 'Not found');
    expect(err.status).toBe(404);
    expect(err.message).toBe('Not found');
    expect(err.name).toBe('ApiError');
  });

  it('is an instance of Error', () => {
    expect(new ApiError(500, 'oops')).toBeInstanceOf(Error);
  });
});

describe('handleResponse', () => {
  beforeEach(() => {
    vi.stubGlobal('location', { href: '' });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not throw when response is ok', async () => {
    await expect(handleResponse(makeResponse(200, { ok: true }))).resolves.toBeUndefined();
  });

  it('sets window.location.href to /login on 401', async () => {
    await expect(handleResponse(makeResponse(401))).rejects.toBeInstanceOf(ApiError);
    expect(window.location.href).toBe('/login');
  });

  it('throws ApiError with status 401 on 401', async () => {
    const err = await handleResponse(makeResponse(401)).catch(e => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(401);
  });

  it('uses body.message when non-ok response has JSON message', async () => {
    const err = await handleResponse(
      makeResponse(400, { message: 'Custom error from server' })
    ).catch(e => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).message).toBe('Custom error from server');
  });

  it('falls back to messageForStatus when body is not JSON', async () => {
    const response = new Response('plain text', { status: 400 });
    const err = await handleResponse(response).catch(e => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).message).toBe('Bad request. Please check your input.');
  });

  it('returns the right message for status 400', async () => {
    const err = await handleResponse(makeResponse(400)).catch(e => e);
    expect((err as ApiError).message).toBe('Bad request. Please check your input.');
  });

  it('returns the right message for status 403', async () => {
    const err = await handleResponse(makeResponse(403)).catch(e => e);
    expect((err as ApiError).message).toBe("You don't have permission to access this resource.");
  });

  it('returns the right message for status 404', async () => {
    const err = await handleResponse(makeResponse(404)).catch(e => e);
    expect((err as ApiError).message).toBe('The requested resource could not be found.');
  });

  it('returns the right message for status 409', async () => {
    const err = await handleResponse(makeResponse(409)).catch(e => e);
    expect((err as ApiError).message).toBe('A conflict occurred. The resource may already exist.');
  });

  it('returns the right message for status 422', async () => {
    const err = await handleResponse(makeResponse(422)).catch(e => e);
    expect((err as ApiError).message).toBe('The data provided is invalid.');
  });

  it('returns the right message for status 500', async () => {
    const err = await handleResponse(makeResponse(500)).catch(e => e);
    expect((err as ApiError).message).toBe('Something went wrong on our end. Please try again later.');
  });

  it('returns the right message for status 503', async () => {
    const err = await handleResponse(makeResponse(503)).catch(e => e);
    expect((err as ApiError).message).toBe('The service is temporarily unavailable. Please try again later.');
  });

  it('returns a default message for unknown status codes', async () => {
    const err = await handleResponse(makeResponse(418)).catch(e => e);
    expect((err as ApiError).message).toBe('An unexpected error occurred (HTTP 418).');
  });
});
