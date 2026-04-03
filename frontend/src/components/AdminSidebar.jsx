import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

const ADMIN_MENU_ITEMS = [
  { to: '/admin', label: 'Bảng điều khiển', icon: 'bi bi-grid-1x2-fill', end: true },
  { to: '/admin/rooms', label: 'Quản lý phòng', icon: 'bi bi-door-open-fill' },
  { to: '/admin/bookings', label: 'Đơn đặt phòng', icon: 'bi bi-calendar-check-fill' },
  { to: '/admin/coupons', label: 'Mã giảm giá', icon: 'bi bi-ticket-perforated-fill' },
  { to: '/admin/news', label: 'Tin tức & Sự kiện', icon: 'bi bi-newspaper' },
  { to: '/admin/inbox', label: 'Inbox liên hệ', icon: 'bi bi-envelope-fill' },
  { to: '/admin/room-types', label: 'Loại phòng', icon: 'bi bi-collection-fill' },
  { to: '/admin/users', label: 'Người dùng', icon: 'bi bi-people-fill' },
  { to: '/admin/items', label: 'Vật phẩm', icon: 'bi bi-box-seam-fill' },
];

export default function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [menuIndicatorStyle, setMenuIndicatorStyle] = useState({ top: 0, height: 0, opacity: 0 });
  const menuListRef = useRef(null);
  const menuItemRefs = useRef({});

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error(error);
      navigate('/login');
    }
  };

  const isMenuItemActive = (item) => {
    if (item.end) {
      return location.pathname === item.to;
    }
    return location.pathname.startsWith(item.to);
  };

  useEffect(() => {
    const updateMenuIndicator = () => {
      const activeItem = ADMIN_MENU_ITEMS.find((item) => isMenuItemActive(item));
      const container = menuListRef.current;
      const activeNode = activeItem ? menuItemRefs.current[activeItem.to] : null;

      if (!container || !activeNode) {
        setMenuIndicatorStyle((current) => ({ ...current, opacity: 0 }));
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const activeRect = activeNode.getBoundingClientRect();

      setMenuIndicatorStyle({
        top: activeRect.top - containerRect.top,
        height: activeRect.height,
        opacity: 1,
      });
    };

    const frameId = window.requestAnimationFrame(updateMenuIndicator);
    window.addEventListener('resize', updateMenuIndicator);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', updateMenuIndicator);
    };
  }, [location.pathname]);

  return (
    <>
      <style>{`
        :root { --primary-color: #4e31aa; --accent-color: #f7a400; }
        .sidebar {
          width: 280px;
          height: 100vh;
          background: #1a1c2e;
          position: fixed;
          left: 0;
          top: 0;
          z-index: 1000;
          transition: 0.3s;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.22) transparent;
        }
        .sidebar::-webkit-scrollbar { width: 6px; }
        .sidebar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.22); border-radius: 999px; }
        .sidebar::-webkit-scrollbar-track { background: transparent; }
        .logo-circle { width: 50px; height: 50px; background: var(--accent-color); border-radius: 15px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: #fff; }
        .menu-list { position: relative; }
        .menu-indicator {
          position: absolute;
          left: 0;
          right: 0;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(78,49,170,0.92), rgba(110,78,212,0.84));
          box-shadow: 0 10px 28px rgba(78,49,170,0.32);
          transition: top 0.28s ease, height 0.28s ease, opacity 0.2s ease;
          z-index: 0;
          opacity: 0;
        }
        .menu-item { position: relative; z-index: 1; display: flex; align-items: center; padding: 14px 20px; color: rgba(255,255,255,0.7); text-decoration: none; border-radius: 12px; margin-bottom: 8px; transition: 0.3s; }
        .menu-item i { margin-right: 15px; font-style: normal; font-size: 1.2rem; }
        .menu-item:hover { background: rgba(255,255,255,0.1); color: #fff; text-decoration: none; }
        .menu-item.active { background: transparent; color: #fff; box-shadow: none; text-decoration: none; }
      `}</style>
      
      <div className="sidebar p-4 shadow-lg">
          <div className="text-center mb-5">
              <h5 className="fw-bold text-white mb-0" style={{ paddingBottom: '10px' }}>GOAT ADMIN</h5>
              <small style={{ color: 'rgba(255,255,255,0.5)' }}>Hệ thống quản lý khách sạn</small>
          </div>

          <div className="menu-list" ref={menuListRef}>
              <span className="menu-indicator" style={menuIndicatorStyle}></span>
              {ADMIN_MENU_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  end={item.end}
                  to={item.to}
                  ref={(node) => {
                    if (node) {
                      menuItemRefs.current[item.to] = node;
                    }
                  }}
                  className={({isActive}) => isActive ? "menu-item active" : "menu-item"}
                >
                    <i className={item.icon}></i> <span>{item.label}</span>
                </NavLink>
              ))}
              <div className="mt-5 pt-5 pb-3">
                  <span onClick={handleLogout} style={{ cursor: 'pointer' }} className="menu-item text-danger">
                      <i className="bi bi-box-arrow-right"></i> <span>Đăng xuất</span>
                  </span>
              </div>
          </div>
      </div>
    </>
  );
}
