import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, setAccessToken } from '../api/client.js';
import { unsubscribeFromPush, syncPushSubscriptionWithUser } from '../utils/push.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Silent refresh on mount to restore existing valid session
  useEffect(() => {
    async function restoreSession() {
      try {
        const res = await api.post('/auth/refresh');
        if (res.data?.accessToken) {
          setAccessToken(res.data.accessToken);
          setUser(res.data.user);
          syncPushSubscriptionWithUser().catch(() => {});
        }
      } catch (_err) {
        // Not logged in or expired refresh token; expected
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []);

  const login = async (email, password, otp) => {
    const res = await api.post('/auth/login', { email, password, otp });
    if (res.data?.accessToken) {
      setAccessToken(res.data.accessToken);
      setUser(res.data.user);
      syncPushSubscriptionWithUser().catch(() => {});
    }
    return res.data;
  };

  const register = async data => {
    const res = await api.post('/auth/register', data);
    return res.data;
  };

  const logout = async () => {
    try {
      await unsubscribeFromPush().catch(() => {});
      await api.post('/auth/logout');
    } catch (_err) {
      // Ignore
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
    } catch (_err) {
      // Ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
