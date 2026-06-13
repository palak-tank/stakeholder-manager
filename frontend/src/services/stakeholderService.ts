import { pagedStakeholderSchema, PagedStakeholders, stakeholderSchema } from '../schemas/stakeholder';
import { Stakeholder } from '../types/stakeholder';

// Override via VITE_API_URL in .env for non-local environments.
// In dev, the Vite proxy forwards /api → http://localhost:5000/api.
const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

const jsonHeaders = { 'Content-Type': 'application/json' };

function handleUnauthorized(response: Response) {
  if (response.status === 401) {
    window.location.href = '/login';
  }
}

export async function getStakeholders(page = 0, pageSize = 10): Promise<PagedStakeholders> {
  const response = await fetch(
    `${API_BASE_URL}/stakeholders?page=${page}&pageSize=${pageSize}`,
    { credentials: 'include' }
  );

  handleUnauthorized(response);

  if (!response.ok) {
    throw new Error('Failed to fetch stakeholders');
  }

  const data = await response.json();
  return pagedStakeholderSchema.parse(data);
}

export type CreateStakeholderInput = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  organisation: string;
  title?: string;
};

export async function createStakeholder(input: CreateStakeholderInput): Promise<Stakeholder> {
  const response = await fetch(`${API_BASE_URL}/stakeholders`, {
    method: 'POST',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify(input),
  });

  handleUnauthorized(response);

  if (response.status === 409) {
    const error = await response.json();
    throw new Error(error.message ?? 'A stakeholder with that email already exists.');
  }

  if (!response.ok) {
    throw new Error('Failed to create stakeholder');
  }

  const data = await response.json();
  return stakeholderSchema.parse(data);
}

export type UpdateStakeholderInput = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  organisation: string;
  title?: string;
};

export async function updateStakeholder(id: number, input: UpdateStakeholderInput): Promise<Stakeholder> {
  const response = await fetch(`${API_BASE_URL}/stakeholders/${id}`, {
    method: 'PUT',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify(input),
  });

  handleUnauthorized(response);

  if (response.status === 409) {
    const error = await response.json();
    throw new Error(error.message ?? 'A stakeholder with that email already exists.');
  }

  if (!response.ok) {
    throw new Error('Failed to update stakeholder');
  }

  return stakeholderSchema.parse(await response.json());
}

export async function deleteStakeholder(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/stakeholders/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  handleUnauthorized(response);

  if (!response.ok) {
    throw new Error('Failed to delete stakeholder');
  }
}
