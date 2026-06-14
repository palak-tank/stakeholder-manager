import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthContext } from '../context/AuthContext';
import { AuthUser } from '../types/auth';
import { ReactNode } from 'react';

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const defaultAuthValue: AuthContextValue = {
  user: null,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
};

export function renderWithRouter(
  ui: ReactNode,
  { initialEntries = ['/'] }: { initialEntries?: string[] } = {}
) {
  return render(<MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>);
}

export function renderWithAuth(
  ui: ReactNode,
  {
    authValue,
    initialEntries = ['/'],
  }: { authValue?: Partial<AuthContextValue>; initialEntries?: string[] } = {}
) {
  const merged = { ...defaultAuthValue, ...authValue };
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthContext.Provider value={merged}>{ui}</AuthContext.Provider>
    </MemoryRouter>
  );
}
