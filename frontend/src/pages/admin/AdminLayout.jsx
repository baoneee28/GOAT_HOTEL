import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminSidebar from '../../components/AdminSidebar';

export default function AdminLayout() {
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:8080/api/home/', { withCredentials: true })
      .then(res => {
        if (!res.data.user_logged_in || res.data.user_logged_in.role?.toLowerCase() !== 'admin') {
          navigate('/login');
        } else {
          setIsAdmin(true);
        }
      })
      .catch(() => navigate('/login'));
  }, [navigate]);

  if (!isAdmin) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <div style={{ background: '#f4f7fe', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <AdminSidebar />
      <div style={{ marginLeft: '280px', padding: '30px' }}>
        <Outlet />
      </div>
    </div>
  );
}
