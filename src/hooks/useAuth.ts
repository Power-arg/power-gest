import { useState, useEffect, createContext, useContext } from 'react';
import { validatePassword } from '@/lib/api';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useAuthProvider() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user was previously authenticated
    const authToken = sessionStorage.getItem('power-admin-auth');
    if (authToken === 'authenticated') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = async (password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const isValid = await validatePassword(password);
      if (isValid) {
        setIsAuthenticated(true);
        sessionStorage.setItem('power-admin-auth', 'authenticated');
        return true;
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('power-admin-auth');
  };

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
}

export { AuthContext };
