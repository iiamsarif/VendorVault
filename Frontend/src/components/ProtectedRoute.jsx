import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { TOKEN_KEYS, decodeJwt } from './api';

function ProtectedRoute({ role, children }) {
  const location = useLocation();
  const token = localStorage.getItem(TOKEN_KEYS[role]);

  if (!token) {
    const loginPath = role === 'admin' ? '/admin/login' : '/login';
    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />;
  }

  const payload = decodeJwt(token);
  if (!payload || payload.role !== role) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
