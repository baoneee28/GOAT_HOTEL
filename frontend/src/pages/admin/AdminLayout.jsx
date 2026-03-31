import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';

export default function AdminLayout() {
  return (
    <div style={{ background: '#f4f7fe', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <AdminSidebar />
      <div style={{ marginLeft: '280px', padding: '30px' }}>
        <Outlet />
      </div>
    </div>
  );
}
