import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { getCurrentUserApi, setAuthSession, clearAuthSession, getAuthToken } from '../api/client';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, role: UserRole, username: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>((localStorage.getItem('callcenter_role') as UserRole) || null);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const userData = await getCurrentUserApi();
          setUser(userData);
          setRole(userData.role);
        } catch {
          // If token expired or invalid, clear
          clearAuthSession();
          setUser(null);
          setToken(null);
          setRole(null);
        }
      }
      setIsLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (newToken: string, newRole: UserRole, username: string) => {
    setAuthSession(newToken, newRole, username);
    setToken(newToken);
    setRole(newRole);
    try {
      const userData = await getCurrentUserApi();
      setUser(userData);
    } catch {
      setUser({
        id: 0,
        username,
        email: `${username}@callcenter.local`,
        role: newRole,
        is_active: true
      });
    }
  };

  const logout = () => {
    clearAuthSession();
    setUser(null);
    setToken(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
