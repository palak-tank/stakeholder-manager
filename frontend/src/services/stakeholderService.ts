import { pagedStakeholderSchema, PagedStakeholders, stakeholderSchema } from '../schemas/stakeholder';
import { Stakeholder } from '../types/stakeholder';
import { ApiError, handleResponse } from './apiError';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api';
const jsonHeaders = { 'Content-Type': 'application/json' };

export async function getStakeholders(page = 0, pageSize = 10): Promise<PagedStakeholders> {
  let response: Response;
  try {
    response = await fetch(
      `${API_BASE_URL}/stakeholders?page=${page}&pageSize=${pageSize}`,
      { credentials: 'include' }
    );
  } catch {
    throw new ApiError(0, 'Unable to reach the server. Check your internet connection.');
  }
  await handleResponse(response);
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
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/stakeholders`, {
      method: 'POST',
      headers: jsonHeaders,
      credentials: 'include',
      body: JSON.stringify(input),
    });
  } catch {
    throw new ApiError(0, 'Unable to reach the server. Check your internet connection.');
  }
  await handleResponse(response);
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
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/stakeholders/${id}`, {
      method: 'PUT',
      headers: jsonHeaders,
      credentials: 'include',
      body: JSON.stringify(input),
    });
  } catch {
    throw new ApiError(0, 'Unable to reach the server. Check your internet connection.');
  }
  await handleResponse(response);
  return stakeholderSchema.parse(await response.json());
}

export async function deleteStakeholder(id: number): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/stakeholders/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
  } catch {
    throw new ApiError(0, 'Unable to reach the server. Check your internet connection.');
  }
  await handleResponse(response);
}
