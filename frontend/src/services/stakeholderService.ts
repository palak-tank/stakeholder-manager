import { pagedStakeholderSchema, PagedStakeholders, stakeholderSchema } from '../schemas/stakeholder';
import { Stakeholder } from '../types/stakeholder';

// Override via VITE_API_URL in .env for non-local environments.
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

export async function getStakeholders(page = 0, pageSize = 10): Promise<PagedStakeholders> {
  const response = await fetch(`${API_BASE_URL}/stakeholders?page=${page}&pageSize=${pageSize}`);

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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

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
