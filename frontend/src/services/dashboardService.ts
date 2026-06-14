import { ApiError, handleResponse } from './apiError';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

export type RoleCount = {
  role: string;
  count: number;
};

export type OrgCount = {
  organisation: string;
  count: number;
};

export type RecentStakeholder = {
  id: number;
  firstName: string;
  lastName: string;
  role: string;
  organisation: string;
  createdAt: string;
};

export type DashboardStats = {
  totalStakeholders: number;
  totalOrganisations: number;
  roleBreakdown: RoleCount[];
  topOrganisations: OrgCount[];
  recentStakeholders: RecentStakeholder[];
};

export async function getDashboardStats(): Promise<DashboardStats> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/dashboard`, { credentials: 'include' });
  } catch {
    throw new ApiError(0, 'Unable to reach the server. Check your internet connection.');
  }
  await handleResponse(response);
  return response.json();
}
