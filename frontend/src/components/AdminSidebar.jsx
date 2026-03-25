import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AdminSidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:8080/api/auth/logout', {}, { withCredentials: true });
      navigate('/login');
    } catch (error) {
      console.error(error);
      navigate('/login');
    }
  };

  return (
    <>
      <style>{`
        :root { --primary-color: #4e31aa; --accent-color: #f7a400; }
        .sidebar { width: 280px; height: 100vh; background: #1a1c2e; position: fixed; left: 0; top: 0; z-index: 1000; transition: 0.3s; }
        .logo-circle { width: 50px; height: 50px; background: var(--accent-color); border-radius: 15px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: #fff; }
        .menu-item { display: flex; align-items: center; padding: 14px 20px; color: rgba(255,255,255,0.7); text-decoration: none; border-radius: 12px; margin-bottom: 8px; transition: 0.3s; }
        .menu-item i { margin-right: 15px; font-style: normal; font-size: 1.2rem; }
        .menu-item:hover { background: rgba(255,255,255,0.1); color: #fff; text-decoration: none; }
        .menu-item.active { background: var(--primary-color); color: #fff; box-shadow: 0 4px 15px rgba(78,49,170,0.4); text-decoration: none; }
      `}</style>
      
      <div className="sidebar p-4 shadow-lg">
          <div className="text-center mb-5">
              <h5 className="fw-bold text-white mb-0" style={{ paddingBottom: '10px' }}>GOAT ADMIN</h5>
              <small style={{ color: 'rgba(255,255,255,0.5)' }}>Hệ thống quản lý khách sạn</small>
          </div>

          <div className="menu-list">
              <NavLink end to="/admin" className={({isActive}) => isActive ? "menu-item active" : "menu-item"}>
                  <i className="bi bi-grid-1x2-fill"></i> <span>Bảng điều khiển</span>
              </NavLink>
              <NavLink to="/admin/rooms" className={({isActive}) => isActive ? "menu-item active" : "menu-item"}>
                  <i className="bi bi-door-open-fill"></i> <span>Quản lý phòng</span>
              </NavLink>
              <NavLink to="/admin/bookings" className={({isActive}) => isActive ? "menu-item active" : "menu-item"}>
                  <i className="bi bi-calendar-check-fill"></i> <span>Đơn đặt phòng</span>
              </NavLink>
              <NavLink to="/admin/news" className={({isActive}) => isActive ? "menu-item active" : "menu-item"}>
                  <i className="bi bi-newspaper"></i> <span>Tin tức & Sự kiện</span>
              </NavLink>
              <NavLink to="/admin/room-types" className={({isActive}) => isActive ? "menu-item active" : "menu-item"}>
                  <i className="bi bi-collection-fill"></i> <span>Loại phòng</span>
              </NavLink>
              <NavLink to="/admin/users" className={({isActive}) => isActive ? "menu-item active" : "menu-item"}>
                  <i className="bi bi-people-fill"></i> <span>Người dùng</span>
              </NavLink>
              <NavLink to="/admin/items" className={({isActive}) => isActive ? "menu-item active" : "menu-item"}>
                  <i className="bi bi-box-seam-fill"></i> <span>Vật phẩm</span>
              </NavLink>
              <div className="mt-5 pt-5">
                  <span onClick={handleLogout} style={{ cursor: 'pointer' }} className="menu-item text-danger">
                      <i className="bi bi-box-arrow-right"></i> <span>Đăng xuất</span>
                  </span>
              </div>
          </div>
      </div>
    </>
  );
}
