import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../config';
import { isAdminRole, normalizeSessionPayload, resolvePostLoginDestination } from './authUtils';
import { AuthContext } from './AuthContextValue';

async function fetchSessionPayload() {
  const res = await axios.get(`${API_BASE}/api/auth/session`, { withCredentials: true });
  return normalizeSessionPayload(res.data);
}

function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-secondary border-t-transparent animate-spin"></div>
    </div>
  );
}

function useAuthContext() {
  const context = React.useContext(AuthContext);

  if (!context) {
    throw new Error('Auth routes must be used within AuthProvider');
  }

  return context;
}

export function AuthProvider({ children }) {
  const [user, setUserState] = React.useState(null);
  const [role, setRoleState] = React.useState(null);
  const [initialized, setInitialized] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const applyAuthState = React.useCallback((payload) => {
    const normalized = normalizeSessionPayload(payload);
    setUserState(normalized.user);
    setRoleState(normalized.role);
    return normalized;
  }, []);

  const refreshAuth = React.useCallback(async () => {
    setLoading(true);
    try {
      const payload = await fetchSessionPayload();
      return applyAuthState(payload);
    } catch {
      return applyAuthState({ authenticated: false });
    } finally {
      setInitialized(true);
      setLoading(false);
    }
  }, [applyAuthState]);

  React.useEffect(() => {
    let active = true;

    const loadSession = async () => {
      setLoading(true);
      try {
        const payload = await fetchSessionPayload();
        if (!active) {
          return;
        }
        applyAuthState(payload);
      } catch {
        if (!active) {
          return;
        }
        applyAuthState({ authenticated: false });
      } finally {
        if (active) {
          setInitialized(true);
          setLoading(false);
        }
      }
    };

    loadSession();

    return () => {
      active = false;
    };
  }, [applyAuthState]);

  const login = React.useCallback(async (credentials) => {
    const res = await axios.post(`${API_BASE}/api/auth/login`, credentials, { withCredentials: true });
    const payload = applyAuthState(res.data);
    setInitialized(true);
    setLoading(false);
    return payload;
  }, [applyAuthState]);

  const logout = React.useCallback(async () => {
    try {
      await axios.post(`${API_BASE}/api/auth/logout`, {}, { withCredentials: true });
    } finally {
      applyAuthState({ authenticated: false });
      setInitialized(true);
      setLoading(false);
    }
  }, [applyAuthState]);

  const setUser = React.useCallback((nextUser) => {
    const resolvedUser = typeof nextUser === 'function' ? nextUser(user) : nextUser;
    const nextRole = resolvedUser ? (isAdminRole(resolvedUser.role) ? 'ADMIN' : 'USER') : null;
    setUserState(resolvedUser || null);
    setRoleState(nextRole);
  }, [user]);

  const value = {
    user,
    role,
    initialized,
    loading,
    isAuthenticated: Boolean(user),
    isAdmin: role === 'ADMIN' || isAdminRole(user?.role),
    refreshAuth,
    login,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function ProtectedRoute({ adminOnly = false }) {
  const location = useLocation();
  const { initialized, loading, isAuthenticated, isAdmin } = useAuthContext();

  if (!initialized || loading) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const location = useLocation();
  const { initialized, loading, user, role } = useAuthContext();

  if (!initialized || loading) {
    return <AuthLoadingScreen />;
  }

  if (user) {
    const destination = resolvePostLoginDestination(
      {
        authenticated: true,
        user,
        role,
        redirectTo: role === 'ADMIN' ? '/admin' : '/',
      },
      location.state,
    );

    return <Navigate to={destination.to} replace state={destination.state} />;
  }

  return <Outlet />;
}
