import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from './LoginPage';
import { useAuth } from '../hooks/useAuth';
import { AuthUser } from '../types/auth';

vi.mock('../hooks/useAuth');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

type AuthValue = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

function renderLoginPage(authValue: Partial<AuthValue> = {}) {
  vi.mocked(useAuth).mockReturnValue({
    user: null,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    ...authValue,
  });

  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/" element={<div>Dashboard</div>} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  mockNavigate.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('LoginPage', () => {
  it('renders the spinner when isLoading is true', () => {
    const { container } = renderLoginPage({ isLoading: true });
    expect(container.querySelector('.animate-spin')).not.toBeNull();
  });

  it('does not render the form while loading', () => {
    renderLoginPage({ isLoading: true });
    expect(screen.queryByText('Sign in')).not.toBeInTheDocument();
  });

  it('redirects to "/" when user is already authenticated', () => {
    renderLoginPage({ user: { email: 'user@example.com' }, isLoading: false });
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders the "Sign in" heading', () => {
    renderLoginPage();
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('renders the email input', () => {
    renderLoginPage();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('renders the password input with type password by default', () => {
    renderLoginPage();
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  });

  it('toggles password input to type text when "Show password" is clicked', async () => {
    const user = userEvent.setup();
    renderLoginPage();
    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');
  });

  it('toggles password input back to type password when "Hide password" is clicked', async () => {
    const user = userEvent.setup();
    renderLoginPage();
    await user.click(screen.getByRole('button', { name: 'Show password' }));
    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  });

  it('calls login with the entered email and password on submit', async () => {
    const mockLogin = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderLoginPage({ login: mockLogin });

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() =>
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'secret')
    );
  });

  it('calls navigate to "/" after successful login', async () => {
    const mockLogin = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderLoginPage({ login: mockLogin });

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
    );
  });

  it('displays the error message when login rejects with an Error', async () => {
    const mockLogin = vi.fn().mockRejectedValue(new Error('Invalid email or password.'));
    const user = userEvent.setup();
    renderLoginPage({ login: mockLogin });

    await user.type(screen.getByLabelText('Email'), 'bad@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() =>
      expect(screen.getByText('Invalid email or password.')).toBeInTheDocument()
    );
  });

  it('displays "Login failed." when login rejects with a non-Error', async () => {
    const mockLogin = vi.fn().mockRejectedValue('something unexpected');
    const user = userEvent.setup();
    renderLoginPage({ login: mockLogin });

    await user.type(screen.getByLabelText('Email'), 'bad@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() =>
      expect(screen.getByText('Login failed.')).toBeInTheDocument()
    );
  });

  it('disables the submit button while submitting', async () => {
    let resolveLogin!: () => void;
    const mockLogin = vi.fn().mockReturnValue(new Promise<void>(r => { resolveLogin = r; }));
    const user = userEvent.setup();
    renderLoginPage({ login: mockLogin });

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Signing in…' })).toBeDisabled()
    );

    resolveLogin();
  });

  it('shows "Signing in…" text during submission', async () => {
    let resolveLogin!: () => void;
    const mockLogin = vi.fn().mockReturnValue(new Promise<void>(r => { resolveLogin = r; }));
    const user = userEvent.setup();
    renderLoginPage({ login: mockLogin });

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() =>
      expect(screen.getByText('Signing in…')).toBeInTheDocument()
    );

    resolveLogin();
  });
});
