import { loginResponseSchema, meResponseSchema } from '../schemas/auth';
import { AuthUser } from '../types/auth';

const AUTH_BASE = '/api/auth';

export async function login(email: string, password: string): Promise<AuthUser> {
  const response = await fetch(`${AUTH_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });

  if (response.status === 401) {
    throw new Error('Invalid email or password.');
  }
  if (!response.ok) {
    throw new Error('Login failed. Please try again.');
  }

  const data = await response.json();
  return loginResponseSchema.parse(data);
}

export async function logout(): Promise<void> {
  await fetch(`${AUTH_BASE}/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}

export async function getMe(): Promise<AuthUser> {
  const response = await fetch(`${AUTH_BASE}/me`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Not authenticated');
  }

  const data = await response.json();
  return meResponseSchema.parse(data);
}
