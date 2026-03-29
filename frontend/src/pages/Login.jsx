import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8080/api/auth/login', { email, password }, { withCredentials: true });
      if (response.data.success) {
        if (window.Swal) window.Swal.fire({ icon: 'success', title: 'Thành công', text: response.data.message, timer: 1500, showConfirmButton: false });
        navigate('/');
      }
    } catch (err) {
      if (window.Swal) window.Swal.fire('Lỗi', err.response?.data?.message || 'Sai thông tin đăng nhập', 'error');
    }
  };

  return (
    <div className="bg-surface font-body text-on-surface antialiased overflow-hidden min-h-screen flex flex-col">
      <style>{`
        .floating-input:focus-within label,
        .floating-input input:not(:placeholder-shown) + label {
          transform: translateY(-1.5rem) scale(0.85);
          color: #000000;
        }
        body { min-height: max(884px, 100dvh); }
      `}</style>

      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-white/10 backdrop-blur-md flex items-center justify-between px-6 h-20">
        <div className="text-xl font-bold tracking-[0.2em] text-stone-900 font-headline uppercase">
          GOAT HOTEL
        </div>
        <Link className="text-stone-400 hover:opacity-70 transition-opacity duration-300" to="/">
          <span className="material-symbols-outlined">close</span>
        </Link>
      </header>

      <main className="flex min-h-screen">
        {/* Left Column: Image (Editorial Asymmetric Layout) */}
        <div className="hidden lg:block lg:w-7/12 relative overflow-hidden bg-surface-container">
          <img
            alt="Luxury hotel lobby"
            className="absolute inset-0 w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDz9rjWA-4lI0ot3meW_1JoCd3_WqJhY5nBbeYyheFFnkkS8VtFnhbS9vpCAT6pTWiRABg7K2oq2LGVMlehf9KzbURqWLsy5yEbhX3AD1sUTdDrHWts84m9NMn7-tc1hiXZoMVPziSoI3f9KEkkwQJSjE1MFqUxC8Izbz5qNAha7vG7cbqlLJX5k7xTEBF4e8qHbfvydb9HK8LkjhDJv8x_AiACTOjEMWL-krIA9qE77lovO5q48ce43Jlll5KuM6u49MRwMFSs1Bpy"
          />
          <div className="absolute inset-0 bg-primary/10"></div>
          {/* Editorial Quote Overlay */}
          <div className="absolute bottom-12 left-12 max-w-md">
            <span className="font-label text-[10px] tracking-widest uppercase text-white/60 mb-4 block">Bộ sưu tập cá nhân</span>
            <h2 className="font-headline text-white text-4xl font-extralight tracking-tight leading-tight">
              Trải nghiệm nghệ thuật sống <br/><span className="italic">đích thực</span>.
            </h2>
          </div>
        </div>

        {/* Right Column: Login Form */}
        <div className="w-full lg:w-5/12 flex flex-col justify-center px-8 md:px-24 bg-surface pt-20">
          <div className="max-w-md w-full mx-auto">
            <header className="mb-16">
              <span className="font-label text-[10px] tracking-[0.2em] text-secondary uppercase mb-2 block font-semibold">Chào Mừng Trở Lại</span>
              <h1 className="font-headline text-5xl font-bold tracking-[-0.04em] text-primary">Đăng nhập</h1>
            </header>

            <form className="space-y-10" onSubmit={handleLogin}>
              {/* Email Field */}
              <div className="relative floating-input group">
                <input
                  className="peer w-full bg-transparent border-0 border-b border-outline-variant/30 py-3 px-0 focus:ring-0 focus:border-primary transition-colors text-on-surface font-headline text-lg"
                  id="email" name="email" placeholder=" " type="email"
                  value={email} onChange={e => setEmail(e.target.value)} required
                />
                <label className="absolute left-0 top-3 text-on-surface-variant pointer-events-none transition-all duration-300 origin-left uppercase text-[10px] tracking-widest font-label" htmlFor="email">
                  Địa chỉ Email
                </label>
              </div>

              {/* Password Field */}
              <div className="relative floating-input group">
                <input
                  className="peer w-full bg-transparent border-0 border-b border-outline-variant/30 py-3 px-0 focus:ring-0 focus:border-primary transition-colors text-on-surface font-headline text-lg"
                  id="password" name="password" placeholder=" " type="password"
                  value={password} onChange={e => setPassword(e.target.value)} required
                />
                <label className="absolute left-0 top-3 text-on-surface-variant pointer-events-none transition-all duration-300 origin-left uppercase text-[10px] tracking-widest font-label" htmlFor="password">
                  Mật khẩu
                </label>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input className="w-4 h-4 rounded-sm border-outline-variant text-primary focus:ring-primary/20" type="checkbox" />
                  <span className="text-[10px] uppercase tracking-widest font-label text-on-surface-variant">Ghi nhớ đăng nhập</span>
                </label>
                <Link className="text-[10px] uppercase tracking-widest font-label text-secondary hover:opacity-70 transition-opacity" to="#">Quên mật khẩu?</Link>
              </div>

              <div className="pt-8 flex flex-col gap-6">
                <button className="w-full py-5 bg-primary text-on-primary font-headline font-bold uppercase tracking-[0.2em] text-xs hover:opacity-90 active:scale-[0.98] transition-all duration-200 rounded-xl" type="submit">
                  Đăng nhập
                </button>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant/20"></div></div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-label">
                    <span className="bg-surface px-4 text-on-surface-variant">Hoặc tiếp tục với</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button className="flex items-center justify-center py-4 border border-outline-variant/20 rounded-xl hover:bg-surface-container-low transition-colors" type="button">
                    <span className="text-[10px] uppercase tracking-widest font-label">Google</span>
                  </button>
                  <button className="flex items-center justify-center py-4 border border-outline-variant/20 rounded-xl hover:bg-surface-container-low transition-colors" type="button">
                    <span className="text-[10px] uppercase tracking-widest font-label">Apple</span>
                  </button>
                </div>
              </div>
            </form>

            <footer className="mt-16 text-center">
              <p className="text-[11px] uppercase tracking-widest font-label text-on-surface-variant">
                Chưa có tài khoản?
                <Link className="text-primary font-bold ml-2 underline decoration-secondary underline-offset-4 hover:text-secondary transition-colors" to="/register">Đăng ký</Link>
              </p>
            </footer>
          </div>
        </div>
      </main>

      {/* Footer - Editorial Minimalist */}
      <footer className="fixed bottom-0 w-full lg:w-5/12 right-0 bg-transparent flex flex-row justify-between items-center px-10 py-8 gap-6 z-10 pointer-events-none">
        <div className="text-on-surface-variant text-[9px] tracking-[0.2em] uppercase font-label">
          © 2024 GOAT HOTEL.
        </div>
        <div className="flex gap-6 pointer-events-auto">
          <Link className="text-on-surface-variant text-[9px] tracking-[0.2em] uppercase font-label hover:text-primary transition-colors" to="#">Bảo mật</Link>
          <Link className="text-on-surface-variant text-[9px] tracking-[0.2em] uppercase font-label hover:text-primary transition-colors" to="#">Điều khoản</Link>
        </div>
      </footer>
    </div>
  );
}
