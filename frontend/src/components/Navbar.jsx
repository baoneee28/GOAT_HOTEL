import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar({ user, onLogout, variant }) {
  const location = useLocation();
  const path = location.pathname;
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 20);

      if (path === '/collections') {
        if (currentScrollY > lastScrollY && currentScrollY > 80) {
          setVisible(false); // Scroll down
        } else {
          setVisible(true); // Scroll up or at top
        }
      } else {
        setVisible(true); // Always visible on other pages
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, path]);

  const isActive = (linkPath) => {
    if (linkPath === '/' && path === '/') return true;
    if (linkPath !== '/' && path.includes(linkPath)) return true;
    return false;
  };

  const navBg = variant === 'dark'
    ? 'bg-slate-950/70 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-slate-950/50'
    : scrolled ? 'bg-primary shadow-2xl' : 'bg-transparent';

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-500 flex justify-between items-center px-12 py-6 ${navBg} ${visible ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="font-headline italic text-2xl tracking-tighter text-white uppercase font-bold">GOAT HOTEL</div>
      <div className="hidden md:flex items-center gap-10">
        <Link className={`font-label font-bold uppercase tracking-widest text-[11px] ${isActive('/') ? 'text-secondary border-b-2 border-secondary pb-1' : 'text-slate-300 hover:text-white transition-colors'}`} to="/">TRANG CHỦ</Link>
        <Link className={`font-label font-bold uppercase tracking-widest text-[11px] ${isActive('/collections') ? 'text-secondary border-b-2 border-secondary pb-1' : 'text-slate-300 hover:text-white transition-colors'}`} to="/collections">ĐẶT PHÒNG</Link>
        <Link className={`font-label font-bold uppercase tracking-widest text-[11px] ${isActive('/news') ? 'text-secondary border-b-2 border-secondary pb-1' : 'text-slate-300 hover:text-white transition-colors'}`} to="/news">TIN TỨC</Link>
        <Link className={`font-label font-bold uppercase tracking-widest text-[11px] ${isActive('/contact') ? 'text-secondary border-b-2 border-secondary pb-1' : 'text-slate-300 hover:text-white transition-colors'}`} to="/contact">LIÊN HỆ</Link>
      </div>
      <div className="flex items-center gap-6">
        <Link to="/profile" className="flex items-center pr-6 border-r border-white/20 hover:opacity-80 transition-opacity cursor-pointer">
          <span className="text-white font-medium text-[13px] font-label tracking-wide">
            {user ? `Xin chào ${user.fullName.split(' ').pop()}` : 'Xin Chào Khách'}
          </span>
        </Link>
        {user ? (
          path === '/profile' ? (
            <button onClick={onLogout} className="font-label font-bold uppercase tracking-widest text-[11px] text-secondary hover:text-white transition-all duration-300">
              ĐĂNG XUẤT
            </button>
          ) : (
            <Link to="/history" className="flex items-center justify-center w-9 h-9 rounded-sm border border-white/10 text-slate-300 hover:text-secondary hover:border-secondary/40 transition-all duration-300" title="My Bookings">
              <span className="material-symbols-outlined text-lg">receipt_long</span>
            </Link>
          )
        ) : (
          <Link to="/login" className="font-label font-bold uppercase tracking-widest text-[11px] text-secondary hover:text-white transition-all duration-300">
            ĐĂNG NHẬP
          </Link>
        )}
      </div>
    </nav>
  );
}
