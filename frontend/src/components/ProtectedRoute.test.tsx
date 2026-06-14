import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '../hooks/useAuth';
import { AuthUser } from '../types/auth';

vi.mock('../hooks/useAuth');

type AuthValue = {
  user: AuthUser | null;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};

function renderProtectedRoute(authValue: Partial<AuthValue> = {}) {
  vi.mocked(useAuth).mockReturnValue({
    user: null,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    ...authValue,
  });

  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<div>Protected Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue({
    user: null,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('ProtectedRoute', () => {
  it('renders the spinner when isLoading is true', () => {
    const { container } = renderProtectedRoute({ isLoading: true });
    expect(container.querySelector('.animate-spin')).not.toBeNull();
  });

  it('does not render protected content while loading', () => {
    renderProtectedRoute({ isLoading: true });
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects to /login when user is not authenticated', () => {
    renderProtectedRoute({ user: null, isLoading: false });
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('does not render protected content when user is not authenticated', () => {
    renderProtectedRoute({ user: null, isLoading: false });
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders protected content when user is authenticated', () => {
    renderProtectedRoute({ user: { email: 'user@example.com' }, isLoading: false });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('does not redirect to /login when user is authenticated', () => {
    renderProtectedRoute({ user: { email: 'user@example.com' }, isLoading: false });
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });
});
