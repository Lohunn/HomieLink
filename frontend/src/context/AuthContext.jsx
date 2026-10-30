import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest, tokenStorage } from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('homielink_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await apiRequest('/auth/profile/');
      setUser(data);
      localStorage.setItem('homielink_user', JSON.stringify(data));
      return data;
    } catch (err) {
      tokenStorage.clear();
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tokenStorage.getAccess()) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [fetchProfile]);

  const login = async (username, password) => {
    const res = await apiRequest('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    tokenStorage.setTokens(res.access, res.refresh);
    return await fetchProfile();
  };

  const register = async (userData) => {
    await apiRequest('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    // Auto login
    return await login(userData.username, userData.password);
  };

  const logout = () => {
    tokenStorage.clear();
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      refreshProfile: fetchProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

