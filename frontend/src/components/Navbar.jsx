import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar({ user, onLogout, variant }) {
  const location = useLocation();
  const path = location.pathname;
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 20);

      if (path === '/collections') {
        if (currentScrollY > lastScrollY && currentScrollY > 80) {
          setVisible(false);
        } else {
          setVisible(true);
        }
      } else {
        setVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, path]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (linkPath) => {
    if (linkPath === '/' && path === '/') return true;
    if (linkPath !== '/' && path.includes(linkPath)) return true;
    return false;
  };

  const navBg = variant === 'dark'
    ? 'bg-slate-950/70 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-slate-950/50'
    : scrolled ? 'bg-primary shadow-2xl' : 'bg-transparent';

  const firstName = user?.fullName?.split(' ').pop() || '';

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-500 flex justify-between items-center px-12 py-6 ${navBg} ${visible ? 'translate-y-0' : '-translate-y-full'}`}>
      <Link
        to="/"
        className="font-headline italic text-2xl tracking-tighter text-white uppercase font-bold no-underline hover:text-white"
      >
        GOAT HOTEL
      </Link>
      <div className="hidden md:flex items-center gap-10">
        <Link className={`font-label font-bold uppercase tracking-widest text-[11px] transition-colors no-underline ${isActive('/') ? 'text-secondary' : 'text-slate-300 hover:text-white'}`} to="/">TRANG CHỦ</Link>
        <Link className={`font-label font-bold uppercase tracking-widest text-[11px] transition-colors no-underline ${isActive('/collections') ? 'text-secondary' : 'text-slate-300 hover:text-white'}`} to="/collections">ĐẶT PHÒNG</Link>
        <Link className={`font-label font-bold uppercase tracking-widest text-[11px] transition-colors no-underline ${isActive('/news') ? 'text-secondary' : 'text-slate-300 hover:text-white'}`} to="/news">TIN TỨC</Link>
        <Link className={`font-label font-bold uppercase tracking-widest text-[11px] transition-colors no-underline ${isActive('/contact') ? 'text-secondary' : 'text-slate-300 hover:text-white'}`} to="/contact">LIÊN HỆ</Link>
      </div>

      <div className="flex items-center gap-6">
        {user ? (
          /* ── USER DROPDOWN ── */
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(prev => !prev)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 hover:bg-white/15 transition-all duration-200 cursor-pointer"
            >
              {/* Avatar circle */}
              <div className="w-6 h-6 rounded-full bg-secondary/30 border border-secondary/50 flex items-center justify-center flex-shrink-0">
                <span className="text-secondary font-bold text-[11px] font-headline">
                  {firstName.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-white font-medium text-[12px] font-label tracking-wide">
                Xin chào {firstName}
              </span>
              <span
                className={`material-symbols-outlined text-white/70 text-sm transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
              >
                expand_more
              </span>
            </button>

            {/* Dropdown Panel */}
            {dropdownOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] w-52 rounded-2xl shadow-xl shadow-black/60 overflow-hidden z-[999]" style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)' }}>
                {/* User info header */}
                <div className="px-4 py-3 border-b" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
                  <p className="text-white text-xs font-semibold truncate">{user.fullName}</p>
                  <p className="text-slate-400 text-[10px] truncate mt-0.5">{user.email || 'Thành viên GOAT HOTEL'}</p>
                </div>

                {/* Menu items */}
                <div className="py-1" style={{ background: '#0f172a' }}>
                  {user?.role?.toLowerCase() === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setDropdownOpen(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', color: '#cbd5e1', fontSize: '12px', textDecoration: 'none', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; }}
                    >
                      <span className="material-symbols-outlined text-base" style={{ fontSize: '16px', color: '#f59e0b', fontVariationSettings: "'FILL' 0, 'wght' 300" }}>admin_panel_settings</span>
                      Trang quản trị
                    </Link>
                  )}

                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', color: '#cbd5e1', fontSize: '12px', textDecoration: 'none', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; }}
                  >
                    <span className="material-symbols-outlined text-base" style={{ fontSize: '16px', color: '#f59e0b', fontVariationSettings: "'FILL' 0, 'wght' 300" }}>person</span>
                    Thông tin cá nhân
                  </Link>

                  <Link
                    to="/history"
                    onClick={() => setDropdownOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', color: '#cbd5e1', fontSize: '12px', textDecoration: 'none', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; }}
                  >
                    <span className="material-symbols-outlined text-base" style={{ fontSize: '16px', color: '#f59e0b', fontVariationSettings: "'FILL' 0, 'wght' 300" }}>receipt_long</span>
                    Lịch sử đặt phòng
                  </Link>

                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', color: '#cbd5e1', fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; }}
                  >
                    <span className="material-symbols-outlined text-base" style={{ fontSize: '16px', color: '#f59e0b', fontVariationSettings: "'FILL' 0, 'wght' 300" }}>confirmation_number</span>
                    Mã giảm giá
                  </div>
                </div>

                {/* Logout */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '4px 0', background: '#0f172a' }}>
                  <button
                    onClick={() => { setDropdownOpen(false); onLogout(); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', background: 'transparent', border: 'none', color: '#f87171', fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.color = '#fca5a5'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#f87171'; }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#f87171', fontVariationSettings: "'FILL' 0, 'wght' 300" }}>logout</span>
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <span className="text-white font-medium text-[13px] font-label tracking-wide">Xin Chào Khách</span>
            <Link to="/login" className="font-label font-bold uppercase tracking-widest text-[11px] text-secondary hover:text-white transition-all duration-300">
              ĐĂNG NHẬP
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
