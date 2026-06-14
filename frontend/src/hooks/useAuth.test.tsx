import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReactNode } from 'react';
import { useAuth } from './useAuth';
import { AuthContext } from '../context/AuthContext';

const mockContextValue = {
  user: null,
  isLoading: false,
  login: async () => {},
  logout: async () => {},
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthContext.Provider value={mockContextValue}>{children}</AuthContext.Provider>
);

describe('useAuth', () => {
  it('returns context value when inside AuthContext.Provider', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('throws when used outside AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within AuthProvider'
    );
  });

  it('throws an instance of Error when outside AuthProvider', () => {
    let caught: unknown;
    try {
      renderHook(() => useAuth());
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(Error);
  });
});
