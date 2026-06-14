import { createContext, useEffect, useState, ReactNode } from 'react';
import * as authService from '../services/authService';
import { AuthUser } from '../types/auth';

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    authService.getMe()
      .then(setUser)
      .catch((err) => {
        // Only clear auth state on a definitive 401; leave it unchanged on network errors
        // so a transient failure doesn't log out a valid session.
        if (err instanceof authService.ApiError && err.status === 401) setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const loggedInUser = await authService.login(email, password);
    setUser(loggedInUser);
  }

  async function logout() {
    await authService.logout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
