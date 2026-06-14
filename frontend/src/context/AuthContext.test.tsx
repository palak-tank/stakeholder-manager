import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { AuthProvider } from './AuthContext';
import { useAuth } from '../hooks/useAuth';
import * as authService from '../services/authService';

vi.mock('../services/authService');

function Consumer() {
  const { user, isLoading, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="user">{user?.email ?? 'none'}</span>
      <button onClick={() => login('a@b.com', 'pw')}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

function renderConsumer() {
  return render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>
  );
}

beforeEach(() => {
  vi.mocked(authService.getMe).mockResolvedValue({ email: 'user@example.com' });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('AuthProvider', () => {
  it('starts with isLoading true before getMe resolves', () => {
    vi.mocked(authService.getMe).mockImplementationOnce(
      () => new Promise(() => {}) // never resolves
    );
    renderConsumer();
    expect(screen.getByTestId('loading').textContent).toBe('true');
  });

  it('sets user.email after getMe resolves', async () => {
    vi.mocked(authService.getMe).mockResolvedValueOnce({ email: 'fetched@example.com' });
    renderConsumer();
    await waitFor(() =>
      expect(screen.getByTestId('user').textContent).toBe('fetched@example.com')
    );
  });

  it('sets isLoading to false after getMe resolves', async () => {
    renderConsumer();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
  });

  it('sets user to null when getMe rejects', async () => {
    vi.mocked(authService.getMe).mockRejectedValueOnce(new Error('Not authenticated'));
    renderConsumer();
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('none'));
  });

  it('sets isLoading to false when getMe rejects', async () => {
    vi.mocked(authService.getMe).mockRejectedValueOnce(new Error('Not authenticated'));
    renderConsumer();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
  });

  it('calls authService.login with the provided email and password', async () => {
    vi.mocked(authService.login).mockResolvedValueOnce({ email: 'a@b.com' });
    renderConsumer();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    fireEvent.click(screen.getByRole('button', { name: 'login' }));
    await waitFor(() =>
      expect(authService.login).toHaveBeenCalledWith('a@b.com', 'pw')
    );
  });

  it('updates user.email after login resolves', async () => {
    vi.mocked(authService.login).mockResolvedValueOnce({ email: 'new@example.com' });
    renderConsumer();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    fireEvent.click(screen.getByRole('button', { name: 'login' }));
    await waitFor(() =>
      expect(screen.getByTestId('user').textContent).toBe('new@example.com')
    );
  });

  it('calls authService.logout when logout is invoked', async () => {
    vi.mocked(authService.logout).mockResolvedValueOnce(undefined);
    renderConsumer();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    fireEvent.click(screen.getByRole('button', { name: 'logout' }));
    await waitFor(() => expect(authService.logout).toHaveBeenCalled());
  });

  it('sets user to null after logout resolves', async () => {
    vi.mocked(authService.logout).mockResolvedValueOnce(undefined);
    renderConsumer();
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('user@example.com'));

    fireEvent.click(screen.getByRole('button', { name: 'logout' }));
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('none'));
  });

  it('throws when useAuth is used outside AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within AuthProvider'
    );
  });
});
