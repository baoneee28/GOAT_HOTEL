import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { useAuth } from '../auth/useAuth';

export default function MainLayout() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="bg-surface text-on-surface selection:bg-secondary-fixed selection:text-on-secondary-fixed antialiased min-h-screen flex flex-col">
      <Navbar user={user} onLogout={handleLogout} />
      
      {/* Dynamic Page Content */}
      <div className="flex-grow flex flex-col">
        <Outlet context={{ user, setUser }} />
      </div>

      <Footer />
    </div>
  );
}
