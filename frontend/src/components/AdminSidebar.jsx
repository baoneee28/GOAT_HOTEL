import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

const SIDEBAR_GROUPS = [
  {
    key: 'operations',
    label: 'Vận hành',
    items: [
      { to: '/admin', label: 'Bảng điều khiển', icon: 'bi bi-grid-1x2-fill', end: true, access: 'backoffice' },
      { to: '/admin/rooms', label: 'Quản lý phòng', icon: 'bi bi-door-open-fill', access: 'backoffice' },
      { to: '/admin/bookings', label: 'Đơn đặt phòng', icon: 'bi bi-calendar-check-fill', access: 'backoffice' },
      { to: '/admin/inbox', label: 'Inbox liên hệ', icon: 'bi bi-envelope-fill', access: 'backoffice' },
    ],
  },
  {
    key: 'system',
    label: 'Hệ thống',
    items: [
      { to: '/admin/coupons', label: 'Mã giảm giá', icon: 'bi bi-ticket-perforated-fill', access: 'admin' },
      { to: '/admin/news', label: 'Tin tức & Sự kiện', icon: 'bi bi-newspaper', access: 'admin' },
      { to: '/admin/room-types', label: 'Loại phòng', icon: 'bi bi-collection-fill', access: 'admin' },
      { to: '/admin/items', label: 'Vật phẩm', icon: 'bi bi-box-seam-fill', access: 'admin' },
      { to: '/admin/users', label: 'Người dùng', icon: 'bi bi-people-fill', access: 'admin' },
    ],
  },
];

function canAccessItem(item, isAdmin) {
  return item.access === 'backoffice' || isAdmin;
}

export default function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, isAdmin, isStaff } = useAuth();
  const [menuIndicatorStyle, setMenuIndicatorStyle] = useState({ top: 0, height: 0, opacity: 0 });
  const menuListRef = useRef(null);
  const menuItemRefs = useRef({});

  const visibleGroups = useMemo(
    () => SIDEBAR_GROUPS
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => canAccessItem(item, isAdmin)),
      }))
      .filter((group) => group.items.length > 0),
    [isAdmin],
  );

  const visibleItems = useMemo(
    () => visibleGroups.flatMap((group) => group.items),
    [visibleGroups],
  );

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
      const activeItem = visibleItems.find((item) => isMenuItemActive(item));
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
  }, [location.pathname, visibleItems]);

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
        .menu-group-label {
          position: relative;
          z-index: 1;
          margin: 22px 0 12px;
          padding: 0 8px;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.42);
        }
      `}</style>

      <div className="sidebar p-4 shadow-lg">
        <div className="text-center mb-5">
          <h5 className="fw-bold text-white mb-0" style={{ paddingBottom: '10px' }}>
            {isStaff && !isAdmin ? 'GOAT OPERATIONS' : 'GOAT ADMIN'}
          </h5>
          <small style={{ color: 'rgba(255,255,255,0.5)' }}>
            {isStaff && !isAdmin ? 'Khu vận hành cho nhân viên' : 'Hệ thống quản lý khách sạn'}
          </small>
        </div>

        <div className="menu-list" ref={menuListRef}>
          <span className="menu-indicator" style={menuIndicatorStyle}></span>
          {visibleGroups.map((group) => (
            <div key={group.key}>
              <div className="menu-group-label">{group.label}</div>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  end={item.end}
                  to={item.to}
                  ref={(node) => {
                    if (node) {
                      menuItemRefs.current[item.to] = node;
                    }
                  }}
                  className={({ isActive }) => (isActive ? 'menu-item active' : 'menu-item')}
                >
                  <i className={item.icon}></i> <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}

          <div className="mt-5 pt-4 pb-3">
            <span onClick={handleLogout} style={{ cursor: 'pointer' }} className="menu-item text-danger">
              <i className="bi bi-box-arrow-right"></i> <span>Đăng xuất</span>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
