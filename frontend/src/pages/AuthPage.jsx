import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(location.pathname === '/register' ? 'register' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formData, setFormData] = useState({ fullname: '', email: '', phone: '', password: '' });
  const [user, setUser] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:8080/api/home/', { withCredentials: true })
      .then(res => { if (res.data.user_logged_in) setUser(res.data.user_logged_in); })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:8080/api/auth/logout', {}, { withCredentials: true });
      setUser(null);
      navigate('/');
    } catch {}
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:8080/api/auth/login', { email, password }, { withCredentials: true });
      // Accept any 2xx or explicit success flag
      if (res.status === 200 || res.data?.success) {
        const msg = res.data?.message || 'Đăng nhập thành công!';
        if (window.Swal) {
          window.Swal.fire({ icon: 'success', title: 'Thành công', text: msg, timer: 1500, showConfirmButton: false })
            .then(() => navigate('/'));
        } else {
          alert(msg);
          navigate('/');
        }
      } else {
        const errMsg = res.data?.message || 'Sai thông tin đăng nhập';
        if (window.Swal) window.Swal.fire('Lỗi', errMsg, 'error');
        else alert('Lỗi: ' + errMsg);
      }
    } catch (err) {
      console.error('Login error:', err.response?.data ?? err.message);
      const errMsg = err.response?.data?.message || 'Sai email hoặc mật khẩu';
      if (window.Swal) window.Swal.fire('Lỗi đăng nhập', errMsg, 'error');
      else alert('Lỗi: ' + errMsg);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:8080/api/auth/register', formData, { withCredentials: true });
      if (res.data.success) {
        if (window.Swal) {
          window.Swal.fire({ icon: 'success', title: 'Thành công', text: res.data.message }).then(() => setActiveTab('login'));
        } else {
          setActiveTab('login');
        }
      }
    } catch (err) {
      console.error('Register error:', err.response?.data ?? err.message);
      const errMsg = err.response?.data?.message || 'Có lỗi xảy ra khi đăng ký';
      if (window.Swal) window.Swal.fire('Lỗi đăng ký', errMsg, 'error');
      else alert('Lỗi: ' + errMsg);
    }
  };

  return (
    <div className="font-body text-on-background antialiased">
      <style>{`
        .form-floating-label { position: relative; }
        .form-floating-label input:focus ~ label,
        .form-floating-label input:not(:placeholder-shown) ~ label {
          transform: translateY(-1.5rem) scale(0.85);
          color: #775a19;
        }
        .form-floating-label label {
          position: absolute;
          left: 0;
          top: 0.75rem;
          transition: all 0.2s ease-out;
          pointer-events: none;
        }
        .bg-hero-gradient {
          background: linear-gradient(135deg, #000614 0%, #001f41 100%);
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        /* Right panel scrolls independently without body scroll */
        .auth-layout {
          display: flex;
          flex-direction: row;
          height: 100vh;
          overflow: hidden;
        }
        .auth-left {
          position: relative;
          width: 60%;
          flex-shrink: 0;
          overflow: hidden;
        }
        .auth-right {
          width: 40%;
          overflow-y: auto;
          padding-top: 80px; /* navbar height */
        }
        @media (max-width: 768px) {
          .auth-layout { flex-direction: column; height: auto; overflow: visible; }
          .auth-left { width: 100%; height: 50vh; }
          .auth-right { width: 100%; overflow-y: visible; }
        }
      `}</style>

      {/* Shared Navbar */}
      <Navbar user={user} onLogout={handleLogout} variant="dark" />

      {/* Split Screen Layout */}
      <div className="auth-layout">

        {/* Left Panel: Visual/Atmosphere */}
        <div className="auth-left">
          {/* Background image */}
          <div className="absolute inset-0 z-0">
            <img
              alt="Luxurious resort infinity pool at dusk"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD8M-FaRoCO8wBYor7LaCaMvUdbWL9eJFdQhitFz_hFpNhqxUJgG5pgJ0_DH7OcDG5WXztdRva1kdtFooZZ5PpRlLCpJY8fpLhH7gY3zch59Z7NNFj__0qpgwy8ddNXY70Ej3IBUbFu-Om1PRnoYyYYv9FT2gJRda9MYu9VsJXcCwSK1yndY3etLlA2F8Ikw9qOJARK44RpziXj9C2FS6v2A74vm5JAoetNVOWNL2KPzv0UC5BY5SThqpEjpHtRxmCDqYt1BZquypQ"
            />
            <div className="absolute inset-0 bg-hero-gradient opacity-60"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-primary via-transparent to-transparent"></div>
          </div>

          {/* Bottom-aligned content */}
          <div className="absolute bottom-0 left-0 right-0 z-10 p-8 md:p-20 pb-16">
            <h1 className="font-headline text-white text-4xl md:text-6xl mb-6 leading-tight tracking-tight">
              Welcome to <br/><span className="italic text-secondary-fixed">GOAT HOTEL</span>
            </h1>
            <p className="text-white/80 text-lg md:text-xl font-light mb-10 max-w-lg">
              Experience world-class luxury relaxation, where luxury meets ultimate peace.
            </p>
            <div className="flex flex-wrap gap-6">
              <div className="glass-card p-6 rounded-sm min-w-[160px]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-secondary" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                  <span className="text-white font-headline text-2xl">4.9/5</span>
                </div>
                <p className="font-label uppercase tracking-widest text-[10px] text-white/60">RATINGS</p>
              </div>
              <div className="glass-card p-6 rounded-sm min-w-[160px]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-secondary" style={{fontVariationSettings: "'FILL' 1"}}>group</span>
                  <span className="text-white font-headline text-2xl">10k+</span>
                </div>
                <p className="font-label uppercase tracking-widest text-[10px] text-white/60">CUSTOMERS</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Auth Form — scrollable */}
        <div className="auth-right bg-surface-container-low">
          <div className="px-8 md:px-12 py-10 max-w-md mx-auto">

            {/* Tab Navigation */}
            <ul className="flex gap-10 mb-12 border-b border-outline-variant/20">
              <li className="relative pb-4">
                <button
                  className={`font-label uppercase tracking-widest text-xs font-bold transition-colors ${activeTab === 'login' ? 'text-secondary' : 'text-on-surface-variant hover:text-on-surface'}`}
                  onClick={() => setActiveTab('login')}
                >
                  LOGIN
                </button>
                {activeTab === 'login' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-secondary"></div>}
              </li>
              <li className="relative pb-4">
                <button
                  className={`font-label uppercase tracking-widest text-xs font-bold transition-colors ${activeTab === 'register' ? 'text-secondary' : 'text-on-surface-variant hover:text-on-surface'}`}
                  onClick={() => setActiveTab('register')}
                >
                  REGISTER
                </button>
                {activeTab === 'register' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-secondary"></div>}
              </li>
            </ul>

            {/* Login Form */}
            {activeTab === 'login' && (
              <form className="space-y-10" onSubmit={handleLogin}>
                <div className="form-floating-label">
                  <input
                    className="block w-full py-3 px-0 text-on-surface bg-transparent border-0 border-b border-outline-variant/40 focus:ring-0 focus:border-secondary transition-colors peer"
                    id="email" name="email" placeholder=" " type="email"
                    value={email} onChange={e => setEmail(e.target.value)} required
                  />
                  <label className="font-label text-sm text-on-surface-variant/60 uppercase tracking-wider" htmlFor="email">EMAIL</label>
                </div>

                <div className="form-floating-label">
                  <input
                    className="block w-full py-3 px-0 text-on-surface bg-transparent border-0 border-b border-outline-variant/40 focus:ring-0 focus:border-secondary transition-colors peer"
                    id="password" name="password" placeholder=" " type="password"
                    value={password} onChange={e => setPassword(e.target.value)} required
                  />
                  <label className="font-label text-sm text-on-surface-variant/60 uppercase tracking-wider" htmlFor="password">PASSWORD</label>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center">
                    <input className="w-4 h-4 rounded-none border-outline-variant text-secondary focus:ring-secondary" id="remember" type="checkbox" />
                    <label className="ml-2 text-xs font-label text-on-surface-variant uppercase tracking-tighter" htmlFor="remember">REMEMBER ME</label>
                  </div>
                  <Link className="text-xs font-label text-secondary uppercase tracking-widest border-b border-secondary/30 hover:border-secondary transition-all" to="#">FORGOT PASSWORD?</Link>
                </div>

                <button
                  className="w-full bg-primary text-on-primary font-label uppercase tracking-widest text-xs py-4 hover:bg-primary-container transition-all shadow-xl shadow-primary/10 active:scale-95"
                  type="submit"
                >
                  LOGIN NOW
                </button>

                <div className="relative py-4 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant/20"></div></div>
                  <span className="relative px-4 bg-surface-container-low text-[10px] font-label text-on-surface-variant/40 uppercase tracking-[0.2em]">OR CONTINUE WITH</span>
                </div>

                <button
                  className="w-full flex items-center justify-center gap-2 py-3 border border-outline-variant/30 hover:bg-surface-container transition-colors"
                  type="button"
                >
                  <span className="font-label uppercase tracking-widest text-[10px]">GOOGLE</span>
                </button>
              </form>
            )}

            {/* Register Form */}
            {activeTab === 'register' && (
              <form className="space-y-8" onSubmit={handleRegister}>
                <div className="form-floating-label">
                  <input
                    className="block w-full py-3 px-0 text-on-surface bg-transparent border-0 border-b border-outline-variant/40 focus:ring-0 focus:border-secondary peer"
                    id="fullname" placeholder=" " type="text"
                    value={formData.fullname} onChange={e => setFormData({...formData, fullname: e.target.value})} required
                  />
                  <label className="font-label text-sm text-on-surface-variant/60 uppercase tracking-wider" htmlFor="fullname">FULL NAME</label>
                </div>

                <div className="form-floating-label">
                  <input
                    className="block w-full py-3 px-0 text-on-surface bg-transparent border-0 border-b border-outline-variant/40 focus:ring-0 focus:border-secondary peer"
                    id="reg-email" placeholder=" " type="email"
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required
                  />
                  <label className="font-label text-sm text-on-surface-variant/60 uppercase tracking-wider" htmlFor="reg-email">EMAIL</label>
                </div>

                <div className="form-floating-label">
                  <input
                    className="block w-full py-3 px-0 text-on-surface bg-transparent border-0 border-b border-outline-variant/40 focus:ring-0 focus:border-secondary peer"
                    id="phone" placeholder=" " type="tel"
                    value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required
                  />
                  <label className="font-label text-sm text-on-surface-variant/60 uppercase tracking-wider" htmlFor="phone">PHONE NUMBER</label>
                </div>

                <div className="form-floating-label">
                  <input
                    className="block w-full py-3 px-0 text-on-surface bg-transparent border-0 border-b border-outline-variant/40 focus:ring-0 focus:border-secondary peer"
                    id="reg-password" placeholder=" " type="password"
                    value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required
                  />
                  <label className="font-label text-sm text-on-surface-variant/60 uppercase tracking-wider" htmlFor="reg-password">PASSWORD</label>
                </div>

                <button
                  className="w-full bg-secondary text-white font-label uppercase tracking-widest text-xs py-4 hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-secondary/10"
                  type="submit"
                >
                  REGISTER ACCOUNT
                </button>
              </form>
            )}

            {/* Footer spacing */}
            <div className="h-16"></div>
          </div>
        </div>
      </div>

      {/* Footer Accent Line */}
      <footer className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-secondary/0 via-secondary to-secondary/0 opacity-30 z-40"></footer>
    </div>
  );
}
