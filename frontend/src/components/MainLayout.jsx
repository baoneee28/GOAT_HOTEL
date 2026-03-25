import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './Navbar';
import Footer from './Footer';

export default function MainLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:8080/api/home/', { withCredentials: true })
      .then((res) => {
        if (res.data.user_logged_in) {
          setUser(res.data.user_logged_in);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:8080/api/auth/logout', {}, { withCredentials: true });
      setUser(null);
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
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
