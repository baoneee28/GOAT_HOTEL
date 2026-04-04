import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';
import { useAuth } from '../../auth/useAuth';

export default function AdminLayout() {
  const { initialized, loading, isBackoffice } = useAuth();

  if (!initialized || loading) {
    return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;
  }

  if (!isBackoffice) {
    return <Navigate to="/" replace />;
  }

  return (
    <div style={{ background: '#f4f7fe', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <AdminSidebar />
      <div style={{ marginLeft: '280px', padding: '30px' }}>
        <Outlet />
      </div>
    </div>
  );
}
