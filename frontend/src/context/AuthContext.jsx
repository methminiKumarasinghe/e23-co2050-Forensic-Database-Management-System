import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('fmis_token');
    const storedUser  = localStorage.getItem('fmis_user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('fmis_token');
        localStorage.removeItem('fmis_user');
      }
    }
    setLoading(false);
  }, []);

  /**
   * Called after successful login API response
   */
  const login = useCallback((data) => {
    const { token: newToken, user: newUser } = data;
    localStorage.setItem('fmis_token', newToken);
    localStorage.setItem('fmis_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  /**
   * Clear session
   */
  const logout = useCallback(() => {
    localStorage.removeItem('fmis_token');
    localStorage.removeItem('fmis_user');
    setToken(null);
    setUser(null);
  }, []);

  /**
   * Refresh the user profile from the server
   */
  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      const updated = res.data.data;
      setUser(updated);
      localStorage.setItem('fmis_user', JSON.stringify(updated));
    } catch {
      logout();
    }
  }, [logout]);

  const isAuthenticated = !!token && !!user;

  const hasRole = useCallback(
    (...roles) => roles.includes(user?.role),
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        login,
        logout,
        refreshUser,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export default AuthContext;
