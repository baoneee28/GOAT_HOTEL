import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar({ user, onLogout, variant }) {
  const location = useLocation();
  const path = location.pathname;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (linkPath) => {
    if (linkPath === '/' && path === '/') return true;
    if (linkPath !== '/' && path.includes(linkPath)) return true;
    return false;
  };

  const navBg = variant === 'dark'
    ? 'bg-slate-950/70 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-slate-950/50'
    : scrolled ? 'bg-primary shadow-2xl border-b border-white/5' : 'bg-transparent';

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 flex justify-between items-center px-12 py-6 ${navBg}`}>
      <div className="font-headline italic text-2xl tracking-tighter text-white uppercase font-bold">GOAT HOTEL</div>
      <div className="hidden md:flex items-center gap-10">
        <Link className={`font-label font-bold uppercase tracking-widest text-[11px] ${isActive('/') ? 'text-secondary border-b-2 border-secondary pb-1' : 'text-slate-300 hover:text-white transition-colors'}`} to="/">HOME</Link>
        <Link className={`font-label font-bold uppercase tracking-widest text-[11px] ${isActive('/collections') ? 'text-secondary border-b-2 border-secondary pb-1' : 'text-slate-300 hover:text-white transition-colors'}`} to="/collections">BOOKING</Link>
        <Link className={`font-label font-bold uppercase tracking-widest text-[11px] ${isActive('/news') ? 'text-secondary border-b-2 border-secondary pb-1' : 'text-slate-300 hover:text-white transition-colors'}`} to="/news">NEWS</Link>
        <Link className={`font-label font-bold uppercase tracking-widest text-[11px] ${isActive('/contact') ? 'text-secondary border-b-2 border-secondary pb-1' : 'text-slate-300 hover:text-white transition-colors'}`} to="/contact">CONTACT</Link>
      </div>
      <div className="flex items-center gap-6">
        <Link to="/profile" className="flex items-center pr-6 border-r border-white/20 hover:opacity-80 transition-opacity cursor-pointer">
          <span className="text-white font-medium text-[13px] font-label tracking-wide">
            {user ? `Welcome ${user.fullName.split(' ').pop()}` : 'Welcome Guest'}
          </span>
        </Link>
        {path === '/profile' ? (
          user ? (
            <button onClick={onLogout} className="font-label font-bold uppercase tracking-widest text-[11px] text-secondary hover:text-white transition-all duration-300">
              LOGOUT
            </button>
          ) : (
            <Link to="/login" className="font-label font-bold uppercase tracking-widest text-[11px] text-secondary hover:text-white transition-all duration-300">
              LOGIN
            </Link>
          )
        ) : (
          <Link to="/history" className="flex items-center justify-center w-9 h-9 rounded-sm border border-white/10 text-slate-300 hover:text-secondary hover:border-secondary/40 transition-all duration-300" title="My Bookings">
            <span className="material-symbols-outlined text-lg">receipt_long</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
